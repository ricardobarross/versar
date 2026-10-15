import ClienteForm from '@/components/admin/ClienteForm'

export default function NewCustomerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Novo cliente</h1>
      <ClienteForm />
    </div>
  )
}