'use client';

import React from 'react';
import { AidaCard } from './aida-card';
import { AidaButton } from './aida-button';
import { CreditCard, TrendingUp, Receipt, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/design-system';

interface BillingCardProps {
  currentPlan: string;
  nextBillAmount: number;
  nextBillDate: Date;
  paymentMethod?: string;
  billingCycle: 'monthly' | 'yearly';
  onUpgrade?: () => void;
  onViewBilling?: () => void;
  onUpdatePayment?: () => void;
  paymentStatus?: 'current' | 'overdue' | 'expiring';
  className?: string;
}

export function BillingCard({
  currentPlan,
  nextBillAmount,
  nextBillDate,
  paymentMethod,
  billingCycle,
  onUpgrade,
  onViewBilling,
  onUpdatePayment,
  paymentStatus = 'current',
  className
}: BillingCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getStatusConfig = () => {
    switch (paymentStatus) {
      case 'overdue':
        return {
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          message: 'Pagamento em atraso'
        };
      case 'expiring':
        return {
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          message: 'Cartão próximo ao vencimento'
        };
      default:
        return {
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <CreditCard className="w-5 h-5 text-green-600" />,
          message: 'Pagamentos em dia'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <AidaCard
      title="Assinatura e Cobrança"
      description="Gerencie sua assinatura e métodos de pagamento"
      className={className}
      header={
        <CreditCard className="w-5 h-5 text-amber-600" />
      }
    >
      <div className="space-y-6">
        {/* Status do pagamento */}
        <div className={cn(
          'p-3 rounded-lg border',
          statusConfig.color
        )}>
          <div className="flex items-center gap-3">
            {statusConfig.icon}
            <div>
              <p className={cn('font-medium text-sm', statusConfig.textColor)}>
                {statusConfig.message}
              </p>
              {paymentStatus === 'overdue' && (
                <p className="text-xs text-red-600 mt-1">
                  Atualize seu método de pagamento para evitar interrupções
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Informações do plano atual */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Plano atual</span>
            <span className="font-semibold">{currentPlan}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Próxima cobrança</span>
            <div className="text-right">
              <div className="font-bold text-lg">{formatCurrency(nextBillAmount)}</div>
              <div className="text-xs text-muted-foreground">
                {formatDate(nextBillDate)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Ciclo de cobrança</span>
            <span className="text-sm">
              {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
            </span>
          </div>

          {paymentMethod && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Método de pagamento</span>
              <span className="text-sm">{paymentMethod}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2 border-t">
          <AidaButton
            variant="gold"
            onClick={onUpgrade}
            icon={<TrendingUp className="w-4 h-4" />}
            className="w-full"
          >
            Fazer Upgrade do Plano
          </AidaButton>
          
          <div className="grid grid-cols-2 gap-2">
            <AidaButton
              variant="outline"
              onClick={onViewBilling}
              icon={<Receipt className="w-4 h-4" />}
              size="sm"
            >
              Ver Faturas
            </AidaButton>
            
            <AidaButton
              variant="outline"
              onClick={onUpdatePayment}
              icon={<CreditCard className="w-4 h-4" />}
              size="sm"
            >
              Atualizar Cartão
            </AidaButton>
          </div>
        </div>

        {/* Savings indicator for yearly billing */}
        {billingCycle === 'monthly' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Economize 20% com o plano anual
                </p>
                <p className="text-xs text-amber-700">
                  Mude para cobrança anual e ganhe 2 meses grátis
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AidaCard>
  );
}