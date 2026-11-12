import { Prisma } from '@prisma/client'
import { prisma } from './database.service.js'

const zero = () => new Prisma.Decimal(0)
const money = (amount: Prisma.Decimal) => amount.toFixed(2)
const normalizeIdentity = (value: string | null | undefined) => (value ?? '').trim().toLowerCase()
const normalizeReference = (value: string | null | undefined) => (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')

export async function buildReconciliationQueue(businessId: string, managerUserId?: string) {
  const managerInvoices = managerUserId
    ? await prisma.invoice.findMany({
        where: {
          businessId,
          OR: [
            { assignments: { some: { businessId, userId: managerUserId } } },
            { customer: { is: { assignments: { some: { businessId, userId: managerUserId } } } } },
          ],
        },
        select: { id: true },
      })
    : undefined
  const visibleInvoiceIds = managerInvoices ? new Set(managerInvoices.map(invoice => invoice.id)) : undefined
  const paymentScope = managerUserId ? {
    OR: [
      { customer: { is: { assignments: { some: { businessId, userId: managerUserId } } } } },
      ...(visibleInvoiceIds?.size ? [{ allocations: { some: { invoiceId: { in: [...visibleInvoiceIds] } } } }] : []),
    ],
  } : {}
  const [payments, invoices, customers] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId, status: 'COMPLETED', ...paymentScope },
      include: {
        customer: { select: { id: true, name: true } },
        allocations: { where: { status: 'CONFIRMED' }, select: { invoiceId: true, amount: true, currency: true } },
      },
      orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }],
      take: 250,
    }),
    prisma.invoice.findMany({
      where: { businessId },
      include: {
        customer: { select: { id: true, name: true } },
        allocations: { where: { status: 'CONFIRMED', payment: { status: 'COMPLETED' } }, select: { paymentId: true, amount: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { invoiceNumber: 'asc' }],
      take: 1000,
    }),
    prisma.customer.findMany({
      where: { businessId },
      select: { id: true, name: true, paypalPayerReference: true, email: true },
    }),
  ])

  const availableInvoices = invoices.map(invoice => ({
    ...invoice,
    balance: invoice.totalAmount.minus(invoice.allocations.reduce((sum, allocation) => sum.add(allocation.amount), zero())),
  }))

  const cases = payments.flatMap(payment => {
    const allocatedAmount = payment.allocations.reduce((sum, allocation) => sum.add(allocation.amount), zero())
    const remainingAmount = payment.amount.minus(allocatedAmount)
    if (remainingAmount.lte(0)) return []

    const payerMatches = customers.filter(customer =>
      (payment.payerReference && customer.paypalPayerReference && normalizeIdentity(payment.payerReference) === normalizeIdentity(customer.paypalPayerReference)) ||
      (payment.payerEmail && customer.email && normalizeIdentity(payment.payerEmail) === normalizeIdentity(customer.email)),
    )
    const payerIdentityConflict = Boolean(payment.customerId && payerMatches.some(customer => customer.id !== payment.customerId))
    const matchedCustomerIds = new Set([payment.customerId, ...payerMatches.map(customer => customer.id)].filter((id): id is string => Boolean(id)))
    const referenceText = normalizeReference(`${payment.invoiceReference ?? ''} ${payment.description ?? ''}`)
    const candidates = availableInvoices.flatMap(invoice => {
      if (visibleInvoiceIds && !visibleInvoiceIds.has(invoice.id)) return []
      const refs = [invoice.invoiceNumber, invoice.externalInvoiceReference, invoice.purchaseOrderReference]
        .map(normalizeReference)
        .filter(Boolean)
      const referenceMatch = refs.some(reference => referenceText.includes(reference))
      const customerMatch = matchedCustomerIds.has(invoice.customerId)
      const knownCustomerMismatch = payerIdentityConflict || (matchedCustomerIds.size > 0 && !customerMatch)
      const currencyMatch = payment.currency === invoice.currency
      const balanceAvailable = invoice.balance.gt(0)
      const exactAmountMatch = remainingAmount.eq(invoice.balance)
      const partialAmountMatch = remainingAmount.lt(invoice.balance)
      const amountCanApply = remainingAmount.gt(0) && invoice.balance.gt(0)
      const amountSignal = exactAmountMatch || (partialAmountMatch && (customerMatch || referenceMatch))
      if (!referenceMatch && !customerMatch && (!currencyMatch || matchedCustomerIds.size > 0)) return []

      const existing = payment.allocations.find(allocation => allocation.invoiceId === invoice.id)
      const existingAmount = existing?.amount ?? zero()
      const proposedAdditional = balanceAvailable && currencyMatch
        ? Prisma.Decimal.min(remainingAmount, invoice.balance)
        : zero()
      const recommendedAllocationAmount = existingAmount.add(proposedAdditional)
      const eligible = balanceAvailable && currencyMatch && amountCanApply &&
        !knownCustomerMismatch
      const dueDelta = payment.paymentDate.getTime() - invoice.invoiceDate.getTime()
      const dateCompatible = dueDelta >= 0 && dueDelta <= 180 * 86400000
      const score = Math.min(100,
        (referenceMatch ? 45 : 0) +
        (customerMatch ? 35 : 0) +
        (exactAmountMatch ? 20 : amountSignal ? 10 : 0) +
        (dateCompatible ? 5 : 0),
      )
      const reasons = [
        referenceMatch ? `Payment reference matches ${invoice.invoiceNumber}.` : null,
        customerMatch ? `Payer details match ${invoice.customer.name}.` : null,
        exactAmountMatch ? 'The remaining payment equals the invoice balance.' : partialAmountMatch && amountSignal ? 'The payment can cover part of the open invoice.' : null,
        !currencyMatch ? `Currency mismatch: payment is ${payment.currency}, invoice is ${invoice.currency}.` : null,
        !balanceAvailable ? 'The invoice has no outstanding balance.' : null,
        knownCustomerMismatch && !payerIdentityConflict ? 'The known payer identity differs from the invoice customer.' : null,
        payerIdentityConflict ? 'Payment customer and payer details point to different customers.' : null,
        !referenceMatch && !customerMatch && exactAmountMatch ? 'Only the amount matches; verify the payer before allocating.' : null,
      ].filter((reason): reason is string => Boolean(reason))
      return [{
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customer.name,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        invoiceStatus: invoice.status,
        totalAmount: money(invoice.totalAmount),
        outstandingAmount: money(invoice.balance),
        existingAllocationAmount: money(existingAmount),
        recommendedAllocationAmount: money(recommendedAllocationAmount),
        referenceMatch,
        customerMatch,
        amountMatch: exactAmountMatch,
        currencyMatch,
        dateCompatible,
        score,
        confidence: score >= 80 ? 'Strong signals' : score >= 55 ? 'Some signals' : 'Weak signals',
        eligible,
        ineligibleReason: !currencyMatch
          ? 'Currency must match before an allocation can be recorded.'
          : !balanceAvailable
            ? 'This invoice is already fully paid.'
          : knownCustomerMismatch
              ? 'The payment and invoice have different recorded customers.'
              : null,
        explanation: reasons.length ? reasons.join(' ') : 'No strong matching signals. Review the invoice and payment details manually.',
      }]
    }).sort((a, b) => b.score - a.score || a.dueDate.getTime() - b.dueDate.getTime())

    return [{
      paymentId: payment.id,
      transactionId: payment.paypalTransactionId,
      customerId: payment.customerId,
      customerName: payment.customer?.name ?? (payerMatches.length === 1 ? payerMatches[0].name : null),
      payerReference: payment.payerReference,
      payerEmail: payment.payerEmail,
      paymentDate: payment.paymentDate,
      amount: money(payment.amount),
      allocatedAmount: money(allocatedAmount),
      remainingAmount: money(remainingAmount),
      currency: payment.currency,
      status: payment.status,
      sourceSystem: payment.sourceSystem,
      description: payment.description,
      invoiceReference: payment.invoiceReference,
      candidates,
    }]
  })

  return cases
}
