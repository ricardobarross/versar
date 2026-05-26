import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// =====================================
// POST /api/webhooks
// Recebe eventos externos (pagamentos, ERP, WhatsApp API, etc.)
// =====================================
export async function POST(request: Request) {
  const supabase = supabaseServer();

  const body = await request.json();
  const tipo = body?.tipo ?? "desconhecido";

  // ---------------------------
  // (Opcional) Validação de assinatura
  // ---------------------------
  const assinatura = request.headers.get("x-webhook-signature");
  const segredo = process.env.WEBHOOK_SECRET;

  if (segredo && assinatura !== segredo) {
    return NextResponse.json(
      { error: "Assinatura inválida." },
      { status: 401 }
    );
  }

  // ---------------------------
  // Registrar log do webhook
  // ---------------------------
  const { data: log, error: logError } = await supabase
    .from("webhook_logs")
    .insert({
      tipo,
      payload: body,
      recebido_em: new Date().toISOString(),
      processado: false,
    })
    .select()
    .single();

  if (logError) {
    return NextResponse.json(
      { error: "Erro ao registrar webhook." },
      { status: 500 }
    );
  }

  // ---------------------------
  // Processamento por tipo
  // ---------------------------
  try {
    switch (tipo) {
      case "pagamento_aprovado":
        await supabase
          .from("pedidos")
          .update({
            status: "pago",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.pedido_id);
        break;

      case "pagamento_cancelado":
        await supabase
          .from("pedidos")
          .update({
            status: "cancelado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.pedido_id);
        break;

      case "pedido_enviado":
        await supabase
          .from("pedidos")
          .update({
            status: "enviado",
            updated_at: new Date().toISOString(),
          })
          .eq("id", body.pedido_id);
        break;

      case "mensagem_whatsapp":
        // Exemplo: registrar mensagem recebida
        await supabase.from("mensagens_whatsapp").insert({
          numero: body.numero,
          mensagem: body.mensagem,
          recebido_em: new Date().toISOString(),
        });
        break;

      default:
        // Tipos desconhecidos são apenas logados
        break;
    }

    // Marcar como processado
    await supabase
      .from("webhook_logs")
      .update({ processado: true })
      .eq("id", log.id);

  } catch (erro) {
    await supabase
      .from("webhook_logs")
      .update({ erro: String(erro) })
      .eq("id", log.id);

    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Webhook recebido e processado.",
  });
}
