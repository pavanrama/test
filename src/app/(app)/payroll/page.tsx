'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import {
  formatCurrency, formatDate, todayISO, statusColor,
  PAYROLL_TAX_RATES, calcFederalIncomeTax, calcStateIncomeTax
} from '@/lib/utils';
import type { Employee, PayRun, PayRunEntry, PayrollTaxPayment } from '@/lib/types';
import {
  Landmark, Users, Plus, DollarSign, FileText, Calendar,
  AlertTriangle, CheckCircle, Clock, Trash2, Play, Eye,
  ChevronDown, ChevronRight, Edit2, X, Info, Briefcase,
  Shield, Building2
} from 'lucide-react';
import clsx from 'clsx';

type Tab = 'overview' | 'employees' | 'payruns' | 'taxcenter' | 'forms' | 'journal';

export default function PayrollPage() {
  const {
    myEmployees, myPayRuns, myPayrollTaxPayments, auth,
    addEmployee, updateEmployee, deleteEmployee,
    addPayRun, updatePayRun, deletePayRun,
    addPayrollTaxPayment, updatePayrollTaxPayment,
  } = useApp();

  const employees = myEmployees();
  const payRuns = myPayRuns();
  const taxPayments = myPayrollTaxPayments();
  const activeEmployees = employees.filter(e => e.isActive);

  const [tab, setTab] = useState<Tab>('overview');
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showRunPayroll, setShowRunPayroll] = useState(false);
  const [showPayRunDetail, setShowPayRunDetail] = useState<PayRun | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [empForm, setEmpForm] = useState<{
    name: string; email: string; ssn: string; filingStatus: Employee['filingStatus'];
    allowances: number; payType: Employee['payType']; payRate: number; state: string; startDate: string;
  }>({
    name: '', email: '', ssn: '', filingStatus: 'single',
    allowances: 0, payType: 'salary', payRate: 0, state: 'CA', startDate: todayISO(),
  });

  const [runForm, setRunForm] = useState({
    payPeriodStart: '', payPeriodEnd: '', payDate: '',
    entries: [] as Array<{ employeeId: string; hoursWorked: number }>,
  });

  const tabs: { id: Tab; label: string; icon: typeof Landmark }[] = [
    { id: 'overview', label: 'Overview', icon: Landmark },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'payruns', label: 'Pay Runs', icon: DollarSign },
    { id: 'taxcenter', label: 'Tax Center', icon: Building2 },
    { id: 'forms', label: 'Tax Forms', icon: FileText },
    { id: 'journal', label: 'Journal Preview', icon: Briefcase },
  ];

  const totalGrossPaid = payRuns.filter(p => p.status === 'paid').reduce((s, p) => s + p.entries.reduce((es, e) => es + e.grossPay, 0), 0);
  const totalEmployerTaxes = payRuns.filter(p => p.status !== 'draft').reduce((s, p) => s + p.entries.reduce((es, e) => es + e.totalEmployerTax, 0), 0);
  const totalFUTA = payRuns.filter(p => p.status !== 'draft').reduce((s, p) => s + p.entries.reduce((es, e) => es + e.futa, 0), 0);
  const totalSUTA = payRuns.filter(p => p.status !== 'draft').reduce((s, p) => s + p.entries.reduce((es, e) => es + e.suta, 0), 0);
  const unpaidTaxes = taxPayments.filter(t => t.status === 'unpaid').reduce((s, t) => s + t.amount, 0);

  const lastPayRun = payRuns.length > 0 ? payRuns.sort((a, b) => b.payDate.localeCompare(a.payDate))[0] : null;

  function calcPayRunEntry(emp: Employee, hours: number): PayRunEntry {
    const r = PAYROLL_TAX_RATES;
    const gross = emp.payType === 'salary' ? emp.payRate / 26 : emp.payRate * hours;
    const roundedGross = Math.round(gross * 100) / 100;
    const fedTax = calcFederalIncomeTax(roundedGross, emp.filingStatus);
    const stateTax = calcStateIncomeTax(roundedGross);
    const empSS = Math.round(roundedGross * r.socialSecurity * 100) / 100;
    const empMed = Math.round(roundedGross * r.medicare * 100) / 100;
    const erSS = empSS;
    const erMed = empMed;
    const futa = Math.round(roundedGross * r.federalUnemployment * 100) / 100;
    const suta = Math.round(roundedGross * r.stateUnemployment * 100) / 100;
    const totalEmpTax = Math.round((fedTax + stateTax + empSS + empMed) * 100) / 100;
    const totalErTax = Math.round((erSS + erMed + futa + suta) * 100) / 100;
    return {
      employeeId: emp.id, employeeName: emp.name, hoursWorked: hours,
      grossPay: roundedGross, federalIncomeTax: fedTax, stateIncomeTax: stateTax,
      employeeSS: empSS, employeeMedicare: empMed, employerSS: erSS, employerMedicare: erMed,
      futa, suta, totalEmployeeTax: totalEmpTax, totalEmployerTax: totalErTax,
      netPay: Math.round((roundedGross - totalEmpTax) * 100) / 100,
      totalEmployerCost: Math.round((roundedGross + totalErTax) * 100) / 100,
    };
  }

  function handleAddEmployee() {
    if (!empForm.name || empForm.payRate <= 0) return;
    addEmployee({ ...empForm, isActive: true });
    setEmpForm({ name: '', email: '', ssn: '', filingStatus: 'single', allowances: 0, payType: 'salary', payRate: 0, state: 'CA', startDate: todayISO() });
    setShowAddEmployee(false);
  }

  function handleUpdateEmployee() {
    if (!editingEmployee) return;
    updateEmployee(editingEmployee.id, editingEmployee);
    setEditingEmployee(null);
  }

  function initRunPayroll() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 13);
    setRunForm({
      payPeriodStart: start.toISOString().split('T')[0],
      payPeriodEnd: todayISO(),
      payDate: todayISO(),
      entries: activeEmployees.map(e => ({ employeeId: e.id, hoursWorked: e.payType === 'salary' ? 80 : 0 })),
    });
    setShowRunPayroll(true);
  }

  function handleProcessPayRun() {
    const entries: PayRunEntry[] = runForm.entries.map(re => {
      const emp = employees.find(e => e.id === re.employeeId)!;
      return calcPayRunEntry(emp, re.hoursWorked);
    });
    addPayRun({
      payPeriodStart: runForm.payPeriodStart, payPeriodEnd: runForm.payPeriodEnd,
      payDate: runForm.payDate, status: 'processed', entries,
    });
    setShowRunPayroll(false);
  }

  const previewEntries = useMemo(() => {
    if (!showRunPayroll) return [];
    return runForm.entries.map(re => {
      const emp = employees.find(e => e.id === re.employeeId);
      if (!emp) return null;
      return calcPayRunEntry(emp, re.hoursWorked);
    }).filter(Boolean) as PayRunEntry[];
  }, [showRunPayroll, runForm.entries, employees]);

  const journalPreviewRun = lastPayRun;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Landmark className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Payroll</h1>
            <p className="text-sm text-slate-500">Manage employees, run payroll, and track payroll taxes</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAddEmployee(true); setEmpForm({ name: '', email: '', ssn: '', filingStatus: 'single', allowances: 0, payType: 'salary', payRate: 0, state: 'CA', startDate: todayISO() }); }}
            className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2">
            <Users className="w-4 h-4" /> Add Employee
          </button>
          <button onClick={initRunPayroll} disabled={activeEmployees.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Play className="w-4 h-4" /> Run Payroll
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx('flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
              tab === t.id ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ===================== OVERVIEW ===================== */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Employees', value: String(activeEmployees.length), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'YTD Gross Paid', value: formatCurrency(totalGrossPaid), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'YTD Employer Taxes', value: formatCurrency(totalEmployerTaxes), icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Unpaid Tax Liability', value: formatCurrency(unpaidTaxes), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{k.label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{k.value}</p>
                  </div>
                  <div className={clsx('p-2.5 rounded-xl', k.bg)}><k.icon className={clsx('w-5 h-5', k.color)} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Employer taxes breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Employer Payroll Taxes (per pay run)</h3>
              <div className="space-y-3">
                {[
                  { label: 'Social Security (6.2%)', rate: `${(PAYROLL_TAX_RATES.socialSecurity * 100).toFixed(1)}%`, desc: `Wage base: ${formatCurrency(PAYROLL_TAX_RATES.ssWageBase)}` },
                  { label: 'Medicare (1.45%)', rate: `${(PAYROLL_TAX_RATES.medicare * 100).toFixed(2)}%`, desc: 'No wage base limit' },
                  { label: 'FUTA (0.6%)', rate: `${(PAYROLL_TAX_RATES.federalUnemployment * 100).toFixed(1)}%`, desc: `Wage base: ${formatCurrency(PAYROLL_TAX_RATES.futaWageBase)}` },
                  { label: 'SUTA (2.7%)', rate: `${(PAYROLL_TAX_RATES.stateUnemployment * 100).toFixed(1)}%`, desc: 'Rate varies by state & experience' },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.label}</p>
                      <p className="text-xs text-slate-400">{t.desc}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded">{t.rate}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Employee Payroll Taxes (withheld)</h3>
              <div className="space-y-3">
                {[
                  { label: 'Federal Income Tax', desc: 'Based on W-4 filing status & wages' },
                  { label: 'State Income Tax', desc: 'Varies by state (est. 5%)' },
                  { label: 'Social Security (6.2%)', desc: `Wage base: ${formatCurrency(PAYROLL_TAX_RATES.ssWageBase)}` },
                  { label: 'Medicare (1.45%)', desc: 'No wage base limit' },
                ].map(t => (
                  <div key={t.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.label}</p>
                      <p className="text-xs text-slate-400">{t.desc}</p>
                    </div>
                    <span className="text-xs text-slate-500">Withheld</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Payroll tax calculations shown here are estimates for demo purposes only. Actual rates and filing requirements vary by jurisdiction.
            </p>
          </div>
        </div>
      )}

      {/* ===================== EMPLOYEES ===================== */}
      {tab === 'employees' && (
        <div className="space-y-4">
          {employees.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No employees yet. Add your first employee to start running payroll.</p>
              <button onClick={() => setShowAddEmployee(true)} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4 inline mr-1" /> Add Employee
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Pay Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Filing</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">State</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                          <p className="text-xs text-slate-400">{emp.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 capitalize">{emp.payType}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">
                          {formatCurrency(emp.payRate)}{emp.payType === 'hourly' ? '/hr' : '/yr'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 capitalize">{emp.filingStatus.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{emp.state}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', emp.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                            {emp.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setEditingEmployee({ ...emp })} className="p-1.5 rounded hover:bg-slate-100" title="Edit">
                              <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <button onClick={() => updateEmployee(emp.id, { isActive: !emp.isActive })} className="p-1.5 rounded hover:bg-slate-100" title="Toggle">
                              {emp.isActive ? <X className="w-3.5 h-3.5 text-slate-400" /> : <CheckCircle className="w-3.5 h-3.5 text-slate-400" />}
                            </button>
                            <button onClick={() => { if (confirm(`Delete ${emp.name}?`)) deleteEmployee(emp.id); }} className="p-1.5 rounded hover:bg-slate-100" title="Delete">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== PAY RUNS ===================== */}
      {tab === 'payruns' && (
        <div className="space-y-4">
          {payRuns.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No pay runs yet. Add employees and run your first payroll.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...payRuns].sort((a, b) => b.payDate.localeCompare(a.payDate)).map(pr => {
                const totalGross = pr.entries.reduce((s, e) => s + e.grossPay, 0);
                const totalNet = pr.entries.reduce((s, e) => s + e.netPay, 0);
                const totalErTax = pr.entries.reduce((s, e) => s + e.totalEmployerTax, 0);
                return (
                  <div key={pr.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx('p-2 rounded-lg', pr.status === 'paid' ? 'bg-emerald-50' : pr.status === 'processed' ? 'bg-blue-50' : 'bg-gray-50')}>
                          {pr.status === 'paid' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Pay Period: {formatDate(pr.payPeriodStart)} — {formatDate(pr.payPeriodEnd)}</p>
                          <p className="text-xs text-slate-400">Pay Date: {formatDate(pr.payDate)} · {pr.entries.length} employees</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{formatCurrency(totalGross)} gross</p>
                          <p className="text-xs text-slate-400">{formatCurrency(totalNet)} net · {formatCurrency(totalErTax)} employer tax</p>
                        </div>
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusColor(pr.status))}>
                          {pr.status}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={() => setShowPayRunDetail(pr)} className="p-1.5 rounded hover:bg-slate-100"><Eye className="w-3.5 h-3.5 text-slate-400" /></button>
                          {pr.status === 'processed' && (
                            <button onClick={() => updatePayRun(pr.id, { status: 'paid' })} className="p-1.5 rounded hover:bg-slate-100" title="Mark Paid">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                            </button>
                          )}
                          {pr.status === 'draft' && (
                            <button onClick={() => { if (confirm('Delete this pay run?')) deletePayRun(pr.id); }} className="p-1.5 rounded hover:bg-slate-100">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAX CENTER ===================== */}
      {tab === 'taxcenter' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">FUTA Liability</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalFUTA)}</p>
              <p className="text-xs text-slate-400">Rate: {(PAYROLL_TAX_RATES.federalUnemployment * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">SUTA Liability</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(totalSUTA)}</p>
              <p className="text-xs text-slate-400">Rate: {(PAYROLL_TAX_RATES.stateUnemployment * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">FUTA Wage Base</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(PAYROLL_TAX_RATES.futaWageBase)}</p>
              <p className="text-xs text-slate-400">Per employee annual limit</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 uppercase">SS Wage Base</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(PAYROLL_TAX_RATES.ssWageBase)}</p>
              <p className="text-xs text-slate-400">2024 Social Security limit</p>
            </div>
          </div>

          {/* Quarterly liability */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Quarterly Liability Summary</h3>
                <p className="text-xs text-slate-400">Federal & state unemployment tax tracking</p>
              </div>
              <button onClick={() => {
                const q = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
                const yr = new Date().getFullYear();
                addPayrollTaxPayment({ type: 'futa_940', quarter: q, year: yr, amount: totalFUTA, dueDate: `${yr}-${String(Math.ceil((new Date().getMonth() + 1) / 3) * 3 + 1).padStart(2, '0')}-30`, status: 'unpaid' });
                addPayrollTaxPayment({ type: 'suta', quarter: q, year: yr, amount: totalSUTA, dueDate: `${yr}-${String(Math.ceil((new Date().getMonth() + 1) / 3) * 3 + 1).padStart(2, '0')}-30`, status: 'unpaid', state: auth.company?.state || 'CA' });
              }}
                className="text-xs text-blue-600 font-medium hover:text-blue-700">+ Generate Liabilities</button>
            </div>

            {taxPayments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No tax payment records. Generate liabilities after running payroll.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-slate-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Period</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">State</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Due Date</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {taxPayments.map(tp => (
                      <tr key={tp.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {tp.type === 'federal_941' ? 'Form 941' : tp.type === 'futa_940' ? 'FUTA (940)' : 'SUTA'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{tp.quarter} {tp.year}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{tp.state || 'Federal'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 text-right">{formatCurrency(tp.amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(tp.dueDate)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusColor(tp.status))}>
                            {tp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tp.status === 'unpaid' && (
                            <button onClick={() => updatePayrollTaxPayment(tp.id, { status: 'paid', paidDate: todayISO() })}
                              className="text-xs text-blue-600 font-medium hover:text-blue-700">Mark Paid</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Payroll tax calculations shown here are estimates for demo purposes only. Actual rates and filing requirements vary by jurisdiction.
            </p>
          </div>
        </div>
      )}

      {/* ===================== TAX FORMS ===================== */}
      {tab === 'forms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { form: 'Form 941', title: 'Quarterly Federal Tax Return', desc: 'Report income taxes, Social Security tax, and Medicare tax withheld from employee paychecks, plus employer share of SS and Medicare.', freq: 'Quarterly', due: 'Last day of month following quarter end' },
              { form: 'Form 940', title: 'Annual FUTA Tax Return', desc: 'Report and pay federal unemployment tax (FUTA). Filed annually with quarterly deposit requirements.', freq: 'Annual', due: 'January 31 of following year' },
              { form: 'W-2', title: 'Employee Wage & Tax Statement', desc: 'Summary of wages and taxes for each employee. Must be provided to employees and filed with SSA.', freq: 'Annual', due: 'January 31 to employees & SSA' },
              { form: '1099-NEC', title: 'Nonemployee Compensation', desc: 'Report payments of $600+ to independent contractors during the year.', freq: 'Annual', due: 'January 31 to contractors & IRS' },
            ].map(f => (
              <div key={f.form} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{f.form}</h3>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{f.freq}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{f.title}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{f.desc}</p>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">Due: {f.due}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Filing Status Summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-slate-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Form</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Period</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Employees</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Total Wages</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { form: 'Form 941', period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`, emps: activeEmployees.length, wages: totalGrossPaid, status: payRuns.length > 0 ? 'ready' : 'pending' },
                    { form: 'Form 940', period: String(new Date().getFullYear()), emps: activeEmployees.length, wages: totalGrossPaid, status: 'pending' },
                    { form: 'W-2', period: String(new Date().getFullYear()), emps: activeEmployees.length, wages: totalGrossPaid, status: 'pending' },
                  ].map(row => (
                    <tr key={row.form + row.period} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.form}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.period}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{row.emps}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-right text-slate-900">{formatCurrency(row.wages)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusColor(row.status))}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== JOURNAL PREVIEW ===================== */}
      {tab === 'journal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Payroll Journal Entry Preview</h3>
            <p className="text-xs text-slate-400 mb-4">
              {journalPreviewRun
                ? `Based on pay run: ${formatDate(journalPreviewRun.payPeriodStart)} — ${formatDate(journalPreviewRun.payPeriodEnd)}`
                : 'Run payroll to see the journal entry preview'}
            </p>

            {journalPreviewRun ? (() => {
              const entries = journalPreviewRun.entries;
              const totalGross = entries.reduce((s, e) => s + e.grossPay, 0);
              const totalFedTax = entries.reduce((s, e) => s + e.federalIncomeTax, 0);
              const totalStateTax = entries.reduce((s, e) => s + e.stateIncomeTax, 0);
              const totalEmpSS = entries.reduce((s, e) => s + e.employeeSS, 0);
              const totalEmpMed = entries.reduce((s, e) => s + e.employeeMedicare, 0);
              const totalErSS = entries.reduce((s, e) => s + e.employerSS, 0);
              const totalErMed = entries.reduce((s, e) => s + e.employerMedicare, 0);
              const totalFuta = entries.reduce((s, e) => s + e.futa, 0);
              const totalSutaAmt = entries.reduce((s, e) => s + e.suta, 0);
              const totalErTax = totalErSS + totalErMed + totalFuta + totalSutaAmt;
              const totalNet = entries.reduce((s, e) => s + e.netPay, 0);

              const lines: { account: string; debit: number; credit: number }[] = [
                { account: '6000 · Salaries & Wages', debit: totalGross, credit: 0 },
                { account: '6010 · Payroll Tax Expense', debit: totalErTax, credit: 0 },
                { account: '2310 · Federal Payroll Tax Payable', debit: 0, credit: totalFedTax + totalEmpSS + totalEmpMed + totalErSS + totalErMed },
                { account: '2320 · State Payroll Tax Payable', debit: 0, credit: totalStateTax },
                { account: '2330 · FUTA Payable', debit: 0, credit: totalFuta },
                { account: '2340 · SUTA Payable', debit: 0, credit: totalSutaAmt },
                { account: '2200 · Wages Payable', debit: 0, credit: totalNet },
              ];
              const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
              const totalCredit = lines.reduce((s, l) => s + l.credit, 0);

              return (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="bg-slate-50">
                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Account</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Debit</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Credit</th>
                      </tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {lines.map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className={clsx('px-4 py-2.5 text-sm text-slate-700', l.credit > 0 && 'pl-8')}>{l.account}</td>
                            <td className="px-4 py-2.5 text-sm font-medium text-right text-slate-900">{l.debit > 0 ? formatCurrency(l.debit) : ''}</td>
                            <td className="px-4 py-2.5 text-sm font-medium text-right text-slate-900">{l.credit > 0 ? formatCurrency(l.credit) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot><tr className="bg-slate-50 font-bold">
                        <td className="px-4 py-2.5 text-sm text-slate-900">Totals</td>
                        <td className="px-4 py-2.5 text-sm text-right text-slate-900">{formatCurrency(totalDebit)}</td>
                        <td className="px-4 py-2.5 text-sm text-right text-slate-900">{formatCurrency(totalCredit)}</td>
                      </tr></tfoot>
                    </table>
                  </div>
                  <div className={clsx('mt-3 p-3 rounded-lg text-sm font-medium',
                    Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                    {Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ Entry is balanced' : `⚠ Out of balance by ${formatCurrency(Math.abs(totalDebit - totalCredit))}`}
                  </div>

                  <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">When paid (Cash disbursement):</h4>
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        <tr><td className="py-1.5 text-sm text-slate-700">2200 · Wages Payable</td><td className="py-1.5 text-sm text-right font-medium">{formatCurrency(totalNet)}</td><td className="py-1.5 text-sm text-right"></td></tr>
                        <tr><td className="py-1.5 text-sm text-slate-700 pl-4">1000 · Cash</td><td className="py-1.5 text-sm text-right"></td><td className="py-1.5 text-sm text-right font-medium">{formatCurrency(totalNet)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-8 text-sm text-slate-400">Run payroll to see journal entry preview</div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Payroll tax calculations shown here are estimates for demo purposes only. Actual rates and filing requirements vary by jurisdiction.
            </p>
          </div>
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Add Employee */}
      {showAddEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowAddEmployee(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Employee</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                  <input type="text" value={empForm.name} onChange={e => setEmpForm({ ...empForm, name: e.target.value })}
                    placeholder="John Smith" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                    placeholder="john@company.com" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SSN (last 4)</label>
                  <input type="text" value={empForm.ssn} onChange={e => setEmpForm({ ...empForm, ssn: e.target.value })}
                    placeholder="••••" maxLength={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Filing Status</label>
                  <select value={empForm.filingStatus} onChange={e => setEmpForm({ ...empForm, filingStatus: e.target.value as Employee['filingStatus'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pay Type *</label>
                  <select value={empForm.payType} onChange={e => setEmpForm({ ...empForm, payType: e.target.value as Employee['payType'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="salary">Salary</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pay Rate *</label>
                  <input type="number" value={empForm.payRate || ''} onChange={e => setEmpForm({ ...empForm, payRate: parseFloat(e.target.value) || 0 })}
                    placeholder={empForm.payType === 'salary' ? 'Annual salary' : 'Hourly rate'}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input type="text" value={empForm.state} onChange={e => setEmpForm({ ...empForm, state: e.target.value })}
                    placeholder="CA" maxLength={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input type="date" value={empForm.startDate} onChange={e => setEmpForm({ ...empForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddEmployee(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleAddEmployee} disabled={!empForm.name || empForm.payRate <= 0}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Add Employee</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditingEmployee(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Edit Employee — {editingEmployee.name}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input type="text" value={editingEmployee.name} onChange={e => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" value={editingEmployee.email} onChange={e => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pay Type</label>
                  <select value={editingEmployee.payType} onChange={e => setEditingEmployee({ ...editingEmployee, payType: e.target.value as Employee['payType'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="salary">Salary</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pay Rate</label>
                  <input type="number" value={editingEmployee.payRate} onChange={e => setEditingEmployee({ ...editingEmployee, payRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Filing Status</label>
                  <select value={editingEmployee.filingStatus} onChange={e => setEditingEmployee({ ...editingEmployee, filingStatus: e.target.value as Employee['filingStatus'] })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditingEmployee(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                <button onClick={handleUpdateEmployee} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Payroll */}
      {showRunPayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRunPayroll(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Run Payroll</h2>
            <p className="text-sm text-slate-500 mb-4">Calculate pay and taxes for all active employees</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period Start</label>
                <input type="date" value={runForm.payPeriodStart} onChange={e => setRunForm({ ...runForm, payPeriodStart: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Period End</label>
                <input type="date" value={runForm.payPeriodEnd} onChange={e => setRunForm({ ...runForm, payPeriodEnd: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pay Date</label>
                <input type="date" value={runForm.payDate} onChange={e => setRunForm({ ...runForm, payDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Calculation details per employee */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Employee</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Hours</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Gross</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Emp Tax</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">ER Tax</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">FUTA</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">SUTA</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Net Pay</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">ER Cost</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {previewEntries.map((pe, i) => (
                    <tr key={pe.employeeId} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{pe.employeeName}</td>
                      <td className="px-3 py-2.5 text-right">
                        <input type="number" value={runForm.entries[i]?.hoursWorked || 0}
                          onChange={e => {
                            const next = [...runForm.entries];
                            next[i] = { ...next[i], hoursWorked: parseFloat(e.target.value) || 0 };
                            setRunForm({ ...runForm, entries: next });
                          }}
                          className="w-16 px-2 py-1 text-sm text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium">{formatCurrency(pe.grossPay)}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(pe.totalEmployeeTax)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-600">{formatCurrency(pe.totalEmployerTax)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(pe.futa)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(pe.suta)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(pe.netPay)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(pe.totalEmployerCost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-slate-50 font-bold">
                  <td className="px-3 py-2.5">Totals</td>
                  <td className="px-3 py-2.5 text-right">{previewEntries.reduce((s, e) => s + e.hoursWorked, 0)}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(previewEntries.reduce((s, e) => s + e.grossPay, 0))}</td>
                  <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(previewEntries.reduce((s, e) => s + e.totalEmployeeTax, 0))}</td>
                  <td className="px-3 py-2.5 text-right text-amber-600">{formatCurrency(previewEntries.reduce((s, e) => s + e.totalEmployerTax, 0))}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(previewEntries.reduce((s, e) => s + e.futa, 0))}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(previewEntries.reduce((s, e) => s + e.suta, 0))}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-600">{formatCurrency(previewEntries.reduce((s, e) => s + e.netPay, 0))}</td>
                  <td className="px-3 py-2.5 text-right">{formatCurrency(previewEntries.reduce((s, e) => s + e.totalEmployerCost, 0))}</td>
                </tr></tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowRunPayroll(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleProcessPayRun} disabled={previewEntries.length === 0}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Process Payroll</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Run Detail */}
      {showPayRunDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowPayRunDetail(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pay Run Details</h2>
                <p className="text-sm text-slate-500">{formatDate(showPayRunDetail.payPeriodStart)} — {formatDate(showPayRunDetail.payPeriodEnd)}</p>
              </div>
              <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full capitalize', statusColor(showPayRunDetail.status))}>
                {showPayRunDetail.status}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">Employee</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Gross</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Fed Tax</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">State Tax</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">SS (EE)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Med (EE)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">SS (ER)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Med (ER)</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">FUTA</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">SUTA</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">Net Pay</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">ER Cost</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {showPayRunDetail.entries.map(e => (
                    <tr key={e.employeeId} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{e.employeeName}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(e.grossPay)}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(e.federalIncomeTax)}</td>
                      <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(e.stateIncomeTax)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(e.employeeSS)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(e.employeeMedicare)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-600">{formatCurrency(e.employerSS)}</td>
                      <td className="px-3 py-2.5 text-right text-amber-600">{formatCurrency(e.employerMedicare)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(e.futa)}</td>
                      <td className="px-3 py-2.5 text-right">{formatCurrency(e.suta)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(e.netPay)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(e.totalEmployerCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setShowPayRunDetail(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
