export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/app/api/admin/auth/route";

type ContaPagar = {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  status: "pendente" | "pago" | "atrasado";
};

type ProdutoEstoqueBaixo = {
  id: string;
  name: string;
  stock: number;
  min_stock: number | null;
};

type ClienteInativo = {
  id: string;
  name: string;
  phone: string | null;
  last_order_date: string | null;
  favorite_product: string | null;
  days_without_purchase: number;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Configuração do Supabase ausente.");
  }

  return { url, anonKey };
}

function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function diffInDays(from: string | null): number {
  if (!from) return 9999;
  const d1 = new Date(from);
  const d2 = new Date();
  const diffMs = d2.getTime() - d1.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const supabase = createSupabaseServerClient();

    // Contas a pagar pendentes ou vencendo hoje
    const hoje = new Date().toISOString().slice(0, 10);

    const contasPromise = supabase
      .from("accounts_payable")
      .select("*")
      .in("status", ["pendente", "atrasado"])
      .lte("data_vencimento", hoje);

    // Produtos com estoque baixo
    const produtosPromise = supabase
      .from("products")
      .select("id,name,stock,min_stock")
      .or("stock.lte.min_stock,stock.lte.0");

    // Clientes inativos (ex: sem compra há mais de 30 dias)
    const clientesPromise = supabase.rpc("customers_with_last_order");

    const [contasRes, produtosRes, clientesRes] = await Promise.all([
      contasPromise,
      produtosPromise,
      clientesPromise,
    ]);

    if (contasRes.error) {
      throw new Error(`Erro ao buscar contas a pagar: ${contasRes.error.message}`);
    }
    if (produtosRes.error) {
      throw new Error(`Erro ao buscar produtos: ${produtosRes.error.message}`);
    }
    if (clientesRes.error) {
      throw new Error(`Erro ao buscar clientes inativos: ${clientesRes.error.message}`);
    }

    const contas = (contasRes.data || []) as ContaPagar[];
    const produtosBaixo = (produtosRes.data || []) as ProdutoEstoqueBaixo[];

    const clientesBrutos = (clientesRes.data || []) as {
      id: string;
      name: string;
      phone: string | null;
      last_order_date: string | null;
      favorite_product: string | null;
    }[];

    const clientesInativos: ClienteInativo[] = clientesBrutos
      .map((c) => ({
        ...c,
        days_without_purchase: diffInDays(c.last_order_date),
      }))
      .filter((c) => c.days_without_purchase >= 30)
      .sort((a, b) => b.days_without_purchase - a.days_without_purchase)
      .slice(0, 10);

    const alertas: string[] = [];

    if (contas.length > 0) {
      const atrasadas = contas.filter((c) => c.status === "atrasado").length;
      const pendentes = contas.length - atrasadas;
      if (atrasadas > 0) {
        alertas.push(`${atrasadas} conta(s) em atraso.`);
      }
      if (pendentes > 0) {
        alertas.push(`${pendentes} conta(s) vencendo hoje ou em breve.`);
      }
    }

    if (produtosBaixo.length > 0) {
      alertas.push(`${produtosBaixo.length} produto(s) com estoque baixo.`);
    }

    if (clientesInativos.length > 0) {
      alertas.push(`${clientesInativos.length} cliente(s) inativo(s) há mais de 30 dias.`);
    }

    const mensagens_sugeridas = clientesInativos
      .filter((c) => !!c.phone)
      .slice(0, 5)
      .map((c) => {
        const produto = c.favorite_product || "um dos nossos produtos favoritos";
        const meses = Math.floor(c.days_without_purchase / 30);
        const tempoTexto =
          meses >= 1 ? `${meses} mês(es)` : `${c.days_without_purchase} dia(s)`;

        const mensagem = `Olá ${c.name}! Notei que faz cerca de ${tempoTexto} que você não compra conosco. ` +
          `Separei ${produto} que acho que você vai gostar. Se quiser, posso te mandar algumas opções e condições especiais 😉`;

        return {
          cliente_id: c.id,
          cliente_nome: c.name,
          phone: c.phone,
          produto_sugerido: produto,
          mensagem_whatsapp: mensagem,
        };
      });

    return NextResponse.json(
      {
        success: true,
        resumo: {
          total_contas_pendentes: contas.length,
          total_produtos_estoque_baixo: produtosBaixo.length,
          total_clientes_inativos: clientesInativos.length,
        },
        contas_a_pagar: contas,
        produtos_estoque_baixo: produtosBaixo,
        clientes_inativos: clientesInativos,
        alertas,
        mensagens_sugeridas,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao gerar briefing diário.",
      },
      { status: 500 }
    );
  }
}

