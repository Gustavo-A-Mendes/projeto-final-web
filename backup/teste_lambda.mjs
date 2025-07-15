// Biblioteca para uso do Cognito:
import {
    CognitoIdentityProviderClient,
    AdminUpdateUserAttributesCommand,
    UpdateUserAttributesCommand,
    AdminDeleteUserCommand,
    DeleteUserCommand,
    ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// Bibliotecas para uso do DynamoDB:
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const REGION = "us-east-1";
const USER_POOL_ID = "us-east-1_qnide3CSj"

// Configurar DynamoDB:
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

// Nomes das tabelas:
const MATERIAIS_TABLE = "laboratorio-materiais"
const MOVIMENTACOES_TABLE = "laboratorio-movimentacoes"

// Headers CORS:
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Access-Token,X-Api-Key,X-Amz-Security-Token',
    "Access-Control-Allow-Methods": 'DELETE,GET,HEAD,OPTIONS,PUT,POST,PATCH'
}

// Função principal do Lambda:
export const handler = async (event) => {
    console.log("Event:", JSON.stringify(event, null, 2))
    
    // Tratar preflight CORS
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: "",
        }
    }

    try {
        const { httpMethod, resource, pathParameters } = event
        const body = event.body ? JSON.parse(event.body) : null

        // Verificar autenticação:
        const user = await verifyToken(event.headers)
        // return resposta(200, { test: "ok", message: user })    // Testar autenticação

        if (!user) {
            return resposta(401, { error: "Token inválido ou expirado" })
        }

        // Roteamento para cada resource da API:
        switch (resource) {
            case "/materiais":
                return await routeMateriais(httpMethod, body, user)
            case "/materiais/{id}":
                return await routeMaterialById(httpMethod, pathParameters.id, body, user)
            case "/movimentacoes":
                return await routeMovimentacoes(httpMethod, body, user)
            case "/movimentacoes/{id}":
                return await routeMovimentacaoById(httpMethod, pathParameters.id, body, user)
            case "/movimentacoes/{id}/devolver":
                return await routeDevolverMaterial(pathParameters.id, user)
            case "/usuarios":
                return await routeUsuarios(httpMethod, body, user)
            default:
                return resposta(404, { error: "Rota não encontrada" })
        }
    } catch (error) {
        console.error("Erro:", error)
        return resposta(500, { error: "Erro interno do servidor" })
    }
}

// ================================================================================
// ============================= FUNÇÕES DE ROTEAMENTO ============================

// Roteia para as requisições do resource "/materiais":
async function routeMateriais(method, body, user) {
    switch (method) {
        case "GET":
            return await getMateriais()
        case "POST":
            if (!isAdmin(user)) {
                return resposta(403, { error: "Acesso negado" })
            }
            return await createMaterial(body)
        default:
            return resposta(405, { error: "Método não permitido" })
    }
}

// Roteia para as requisições do resource "/materiais/{id}":
async function routeMaterialById(method, id, body, user) {
    switch (method) {
        case "GET":
            return await getMaterialById(id)
        case "PUT":
            if (!isAdmin(user)) {
                return resposta(403, { error: "Acesso negado" })
            }
            return await updateMaterial(id, body)
        case "DELETE":
            if (!isAdmin(user)) {
                return resposta(403, { error: "Acesso negado" })
            }
            return await deleteMaterial(id)
        default:
            return resposta(405, { error: "Método não permitido" })
    }
}

// Roteia para as requisições do resource "/movimentacoes":
async function routeMovimentacoes(method, body, user) {
    switch (method) {
        case "GET":
            if (isAdmin(user)) {
                return await getAllMovimentacoes()
            } else {
                return await getMovimentacoesByUser(user.email)
            }
        case "POST":
            return await createMovimentacao(body, user)
        default:
            return resposta(405, { error: "Método não permitido" })
    }
}

// Roteia para as requisições do resource "/movimentacoes/{id}":
async function routeMovimentacaoById(method, id, body, user) {
    switch (method) {
        case "GET":
            return await getMovimentacaoById(id, user)
        case "PUT":
            return await updateMovimentacao(id, body, user)
        case "DELETE":
            if (!isAdmin(user)) {
                return resposta(403, { error: "Acesso negado" })
            }
            return await deleteMovimentacao(id)
        default:
            return resposta(405, { error: "Método não permitido" })
    }
}

// Roteia para as requisições do resource "/movimentacoes/{id}/devolver":
async function routeDevolverMaterial(id, user) {
    try {
        // Buscar movimentação
        const params = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id: id },
        }

        const result = await ddb.send(new GetCommand(params))

        if (!result.Item) {
            return resposta(404, { error: "Movimentação não encontrada" })
        }

        const movimentacao = result.Item

        // Verificar se o usuário pode devolver (próprio usuário ou admin)
        if (!isAdmin(user) && movimentacao.usuarioEmail !== user.email) {
            return resposta(403, { error: "Acesso negado" })
        }

        if (movimentacao.status === "Devolvido") {
            return resposta(400, { error: "Material já foi devolvido" })
        }

        // Atualizar status da movimentação
        const paramsUpdateMovimentacao = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id: id },
            UpdateExpression: "SET #status = :status, dataDevolucao = :dataDevolucao",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":status": "Devolvido",
                ":dataDevolucao": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        }

        const updateResult = await ddb.send(new UpdateCommand(paramsUpdateMovimentacao))

        // Devolver quantidade ao estoque
        const paramsUpdateMaterial = {
            TableName: MATERIAIS_TABLE,
            Key: { id: movimentacao.materialId },
            UpdateExpression: "SET quantidade = quantidade + :quantidade, atualizadoEm = :atualizadoEm",
            ExpressionAttributeValues: {
                ":quantidade": movimentacao.quantidade,
                ":atualizadoEm": new Date().toISOString(),
            },
        }

        await ddb.send(new UpdateCommand(paramsUpdateMaterial))

        return resposta(200, updateResult.Attributes)
    } catch (error) {
        console.error("Erro ao devolver material:", error)
        return resposta(500, { error: "Erro ao devolver material" })
    }
}

// Roteia para as requisições do resource "/usuarios":
async function routeUsuarios(method, body, user) {
    // return resposta(200, { message: user })
    switch (method) {
        case "GET":
            if (!isAdmin(user)) {
                return resposta(403, { error: "Acesso negado" })
            }
            return await getAllUsuarios()
        case "PUT":
            if (isAdmin(user)) {
                return await updateUsuario(body.email, body.atributos)
            } else {
                return await updateUsuarioByUser(user.token, body.atributos)
            }
        case "DELETE":
            if (isAdmin(user)) {
                return await deleteUsuario(body.email)
            } else {
                return await deleteUsuarioByUser(user.token)
            }
        default:
            return resposta(405, { error: "Método não permitido" })
    }
}
// ================================================================================
// ======================= FUNÇÕES PARA TABELA DE MATERIAIS =======================

// Método GET para o resource "/materiais":
async function getMateriais() {
    try {
        const params = { TableName: MATERIAIS_TABLE };
        const result = await ddb.send(new ScanCommand(params));
        return resposta(200, result.Items);
    } catch (error) {
        console.error("Erro ao buscar materiais:", error);
        return resposta(500, { error: "Erro ao buscar materiais" });
    }
}

// Método GET para o resource "/materiais/{id}":
async function getMaterialById(id) {
    try {
        const params = {
            TableName: MATERIAIS_TABLE,
            Key: { id: Number.parseInt(id) },
        }

        const result = await ddb.send(new GetCommand(params))

        if (!result.Item) {
            return resposta(404, { error: "Material não encontrado" })
        }

        return resposta(200, result.Item)
    } catch (error) {
        console.error("Erro ao buscar material:", error)
        return resposta(500, { error: "Erro ao buscar material" })
    }
}

// Método POST para o resource "/materiais":
async function createMaterial(data) {
    try {
        if (!data.nome || !data.categoria || data.quantidade === undefined || !data.unidade || !data.descricao) {
            return resposta(400, { error: "Dados obrigatórios não fornecidos" });
        }

        const material = {
            id: Date.now(),
            nome: data.nome,
            categoria: data.categoria,
            quantidade: Number.parseInt(data.quantidade),
            unidade: data.unidade,
            descricao: data.descricao,
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
        };

        const params = {
            TableName: MATERIAIS_TABLE,
            Item: material,
        };

        await ddb.send(new PutCommand(params));
        return resposta(201, material);
    } catch (error) {
        console.error("Erro ao criar material:", error);
        return resposta(500, { error: "Erro ao criar material" });
    }
}

// Método PUT para o resource "/materiais/{id}":
async function updateMaterial(id, data) {
    try {
        const params = {
            TableName: MATERIAIS_TABLE,
            Key: { id: Number.parseInt(id) },
            UpdateExpression:
                "SET #nome = :nome, categoria = :categoria, quantidade = :quantidade, unidade = :unidade, descricao = :descricao, atualizadoEm = :atualizadoEm",
            ExpressionAttributeNames: {
                "#nome": "nome",
            },
            ExpressionAttributeValues: {
                ":nome": data.nome,
                ":categoria": data.categoria,
                ":quantidade": Number.parseInt(data.quantidade),
                ":unidade": data.unidade,
                ":descricao": data.descricao,
                ":atualizadoEm": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        }

        const result = await ddb.send(new UpdateCommand(params))
        return resposta(200, result.Attributes)
    } catch (error) {
        console.error("Erro ao atualizar material:", error)
        return resposta(500, { error: "Erro ao atualizar material" })
    }
}

// Método DELETE para o resource "/materiais/{id}":
async function deleteMaterial(id) {
    try {
        const params = {
            TableName: MATERIAIS_TABLE,
            Key: { id: Number.parseInt(id) },
        }

        await ddb.send(new DeleteCommand(params))
        return resposta(200, { message: "Material excluído com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir material:", error)
        return resposta(500, { error: "Erro ao excluir material" })
    }
}

// ================================================================================
// ===================== FUNÇÕES PARA TABELA DE MOVIMENTAÇÕES =====================

// Método GET para o resource "/movimentacoes" (admin):
async function getAllMovimentacoes() {
    try {
        const params = {
            TableName: MOVIMENTACOES_TABLE,
        }

        const result = await ddb.send(new ScanCommand(params))
        return resposta(200, result.Items)
    } catch (error) {
        console.error("Erro ao buscar movimentações:", error)
        return resposta(500, { error: "Erro ao buscar movimentações" })
    }
}

// Método GET para o resource "/movimentacoes":
async function getMovimentacoesByUser(userEmail) {
    try {
        const params = {
            TableName: MOVIMENTACOES_TABLE,
            FilterExpression: "usuarioEmail = :email",
            ExpressionAttributeValues: {
                ":email": userEmail,
            },
        }

        const result = await ddb.send(new ScanCommand(params))
        return resposta(200, result.Items)
    } catch (error) {
        console.error("Erro ao buscar movimentações do usuário:", error)
        return resposta(500, { error: "Erro ao buscar movimentações" })
    }
}

// Método POST para o resource "/movimentacoes":
async function createMovimentacao(data, user) {
    try {
        if (!Array.isArray(data.materiais) || data.materiais.length === 0) {
            return resposta(400, { error: "Lista de materiais inválida ou vazia" });
        }

        const erros = [];

        // Validar e preparar materiais
        const materiaisValidos = [];
        for (const item of data.materiais) {
            if (!item.materialId || !item.quantidade || !item.finalidade) {
                erros.push(`Material ${item.materialId || "desconhecido"} está com dados incompletos`);
                continue;
            }

            const materialResp = await getMaterialById(item.materialId);
            if (materialResp.statusCode !== 200) {
                erros.push(`Material ID ${item.materialId} não encontrado`);
                continue;
            }

            const material = JSON.parse(materialResp.body);

            if (material.quantidade < item.quantidade) {
                erros.push(`Material "${material.nome}" não tem quantidade suficiente`);
                continue;
            }

            materiaisValidos.push({
                materialId: Number(item.materialId),
                materialNome: item.materialNome || material.nome,
                quantidade: Number(item.quantidade),
                finalidade: item.finalidade,
                observacoes: item.observacoes || "",
                tempoUso: Number(item.tempoUso) || 1,
            });
        }

        if (materiaisValidos.length === 0) {
            return resposta(400, { error: "Nenhum material válido para registrar", detalhes: erros });
        }

        const movimentacao = {
            id: uuidv4(),
            usuario: data.usuario || user.name,
            usuarioEmail: user.email,
            materiais: materiaisValidos,
            status: "Em uso",
            dataRetirada: new Date().toISOString(),
            criadoEm: new Date().toISOString(),
        };

        // Salvar movimentação
        const paramsMovimentacao = {
            TableName: MOVIMENTACOES_TABLE,
            Item: movimentacao,
        };

        await ddb.send(new PutCommand(paramsMovimentacao));

        // Atualizar estoque de cada material
        for (const item of materiaisValidos) {
            const paramsUpdate = {
                TableName: MATERIAIS_TABLE,
                Key: { id: item.materialId },
                UpdateExpression: "SET quantidade = quantidade - :qtd, atualizadoEm = :agora",
                ExpressionAttributeValues: {
                    ":qtd": item.quantidade,
                    ":agora": new Date().toISOString(),
                },
            };

            await ddb.send(new UpdateCommand(paramsUpdate));
        }

        return resposta(201, movimentacao);

    } catch (error) {
        console.error("Erro ao criar movimentação:", error);
        return resposta(500, { error: "Erro ao criar movimentação" });
    }
}


// Método GET para o resource "/movimentacoes/{id}":
async function getMovimentacaoById(id, user) {
    try {
        const params = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id: id },
        }

        const result = await ddb.send(new GetCommand(params));

        if (!result.Item) {
            return resposta(404, { error: "Movimentação não encontrada" })
        }

        // Verificar se o usuário pode acessar a movimentação
        if (!isAdmin(user) && result.Item.usuarioEmail !== user.email) {
            return resposta(403, { error: "Acesso negado" })
        }

        return resposta(200, result.Item)
    } catch (error) {
        console.error("Erro ao buscar movimentação:", error)
        return resposta(500, { error: "Erro ao buscar movimentação" })
    }
}

// Método PUT para o resource "/movimentacoes/{id}":
async function updateMovimentacao(id, user) {
    try {
        // 1. Buscar a movimentação atual para obter lista de materiais
        const getParams = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id },
        };

        const getResult = await ddb.send(new GetCommand(getParams));
        if (!getResult.Item) {
            return resposta(404, { error: "Movimentação não encontrada" });
        }
        const movimentacao = getResult.Item;

        if (movimentacao.status === "Devolvido") {
            return resposta(400, { error: "Movimentação já devolvida" });
        }

        // 2. Atualizar estoque para cada material da movimentação
        const updatePromises = movimentacao.materiais.map(async (mat) => {
            const updateMaterialParams = {
                TableName: MATERIAIS_TABLE,
                Key: { id: mat.materialId },
                UpdateExpression:
                    "SET quantidade = quantidade + :qtd, atualizadoEm = :agora",
                ExpressionAttributeValues: {
                    ":qtd": mat.quantidade,
                    ":agora": new Date().toISOString(),
                },
            };
            return ddb.send(new UpdateCommand(updateMaterialParams));
        });

        await Promise.all(updatePromises);

        // 3. Atualizar status da movimentação para "Devolvido"
        const updateMovParams = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id },
            UpdateExpression:
                "SET #status = :status, atualizadoEm = :agora",
            ExpressionAttributeNames: {
                "#status": "status",
            },
            ExpressionAttributeValues: {
                ":status": "Devolvido",
                ":agora": new Date().toISOString(),
            },
            ReturnValues: "ALL_NEW",
        };

        const updateResult = await ddb.send(new UpdateCommand(updateMovParams));

        return resposta(200, updateResult.Attributes);

    } catch (error) {
        console.error("Erro ao devolver movimentação:", error);
        return resposta(500, { error: "Erro ao devolver movimentação" });
    }
}

// Método DELETE para o resource "/movimentacoes/{id}":
async function deleteMovimentacao(id) {
    try {
        const params = {
            TableName: MOVIMENTACOES_TABLE,
            Key: { id: id },
        }

        await ddb.send(new DeleteCommand(params))
        return resposta(200, { message: "Movimentação excluída com sucesso" })
    } catch (error) {
        console.error("Erro ao excluir movimentação:", error)
        return resposta(500, { error: "Erro ao excluir movimentação" })
    }
}

// ================================================================================
// ============================= FUNÇÕES PARA USUÁRIOS ============================

// Método GET para o resource "/usuarios":
async function getAllUsuarios() {
    const cognito = new CognitoIdentityProviderClient({ region: REGION })

    try {
        const command = new ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Limit: 60,
        });

        const response = await cognito.send(command);
        return resposta(200, response.Users)
    } catch (error) {
        console.error("Erro ao listar usuários:", error);
        return null
    }
}

// Método PUT para o resource "/usuarios" (admin):
async function updateUsuario(email, atributos) {
    try {
        const command = new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: body.email,
            UserAttributes: Object.entries(atributos).map(([Name, Value]) => ({
                Name,
                Value
            }))
        });

        await client.send(command);
        return resposta(200, { message: "Usuário atualizado com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return resposta(500, { message: "Erro ao atualizar usuário", error });
    }
}

// Método PUT para o resource "/usuarios":
async function updateUsuarioByUser(accessToken, atributos) {
    try {
        const command = new UpdateUserAttributesCommand({
            AccessToken: accessToken,
            UserAttributes: Object.entries(atributos).map(([Name, Value]) => ({
                Name,
                Value
            }))
        });

        await client.send(command);
        return resposta(200, { message: "Usuário atualizado com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar seus dados:", error);
        return resposta(500, { message: "Erro ao atualizar dados", error });
    }
}

// Método DELETE para o resource "/usuarios" (admin):
async function deleteUsuario(email) {
    const cognito = new CognitoIdentityProviderClient({ region: REGION })

    try {
        const comandoBusca = new ListUsersCommand({
            UserPoolId: USER_POOL_ID,
            Filter: `email = "${email}"`
        });
        const resultadoBusca = await cognito.send(comandoBusca);

        if (!resultadoBusca.Users || resultadoBusca.Users.length === 0) {
            return resposta(404, { message: "Usuário com esse e-mail não encontrado." });
        }

        const username = resultadoBusca.Users[0].Username;
        // return resposta(200, { message: username })

        const command = new AdminDeleteUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: username
        });

        await cognito.send(command);
        return resposta(200, { message: "Usuário excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        return resposta(500, { message: "Erro ao excluir usuário", error });
    }
}

// Método DELETE para o resource "/usuarios":
async function deleteUsuarioByUser(accessToken) {
    const cognito = new CognitoIdentityProviderClient({ region: REGION })

    try {
        const command = new DeleteUserCommand({ AccessToken: accessToken });
        await cognito.send(command);
        
        return resposta(200, { message: "Usuário excluído com sucesso" });
    } catch (error) {
        console.error("Erro ao excluir sua conta:", error);
        return resposta(500, { message: "Erro ao excluir sua conta", error });
    }
}

// ================================================================================
// ============================== FUNÇÕES AUXILIARES ==============================

// Verifica se o usuário está autenticado:
async function verifyToken(header) {
    const accessHeader = header["x-access-token"] || "";
    if (!accessHeader || !accessHeader.startsWith("Bearer ")) {
        return null
    }
    
    const idHeader = header.Authorization
    if (!idHeader || !idHeader.startsWith("Bearer ")) {
        return null
    }
    
    const idToken = idHeader.replace("Bearer ", "");
    const accessToken = accessHeader.replace("Bearer ", "");

    try {
        // Decodificar JWT (em produção, usar biblioteca JWT adequada)
        const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64").toString())

        // Verificar se o token não expirou
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return null
        }

        return {
            email: payload.email,
            name: payload.name,
            groups: payload["cognito:groups"] || [],
            token: accessToken
        }
    } catch (error) {
        console.error("Erro ao verificar token:", error)
        return null
    }
}

// Verifica se o usuário é do grupo "Administrador":
function isAdmin(user) {
    return user.groups.includes("Administrador")
}

// Função genérica para retorno das requisições:
function resposta(statusCode, body) {
    return {
        statusCode,
        headers: corsHeaders,
        body: JSON.stringify(body),
    }
}
