import DashboardCard from "@/components/dashboard/DashboardCard";

export default async function DashboardPage() {
  const totalProdutos = 0;
  const totalClientes = 0;
  const totalPedidos = 0;
  const produtosEstoqueBaixo = 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <DashboardCard title="Produtos" value={totalProdutos} href="/produtos" />
      <DashboardCard title="Clientes" value={totalClientes} href="/clientes" />
      <DashboardCard title="Pedidos" value={totalPedidos} href="/pedidos" />
      <DashboardCard
        title="Estoque"
        value={produtosEstoqueBaixo}
        href="/estoque"
      />
      <DashboardCard title="Relatórios" value="Ver" href="/relatorios" />
    </div>
  );
}

