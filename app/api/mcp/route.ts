import { toFetchResponse, toReqRes } from "fetch-to-node";
import { prepararBancoDeDados } from "@/infrastructure/db/client";
import { servidorMcp } from "@/infrastructure/dependencias";

const CAMINHO_HTTP = "/api/mcp";

async function atender(requisicao: Request): Promise<Response> {
  await prepararBancoDeDados();

  const { req, res } = toReqRes(requisicao);

  await servidorMcp().startHTTP({
    url: new URL(requisicao.url),
    httpPath: CAMINHO_HTTP,
    req,
    res,
  });

  return toFetchResponse(res);
}

export const GET = atender;
export const POST = atender;
export const DELETE = atender;
