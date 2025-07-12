## **Guia de Implementação Completo**

### **📋 1. Configuração do DynamoDB**

#### **Tabelas Necessárias:**

**1. `laboratorio-materiais`**

- **Partition Key:** `id` (Number)
- **Atributos:** nome, categoria, quantidade, unidade, descricao, criadoEm, atualizadoEm


**2. `laboratorio-movimentacoes`**

- **Partition Key:** `id` (String)
- **GSI:** `usuarioEmail-index` (para consultas por usuário)
- **Atributos:** materialId, materialNome, usuario, usuarioEmail, quantidade, finalidade, status, dataRetirada, dataDevolucao

### **📡 2. Rotas da API Gateway**

```plaintext
GET    /materiais                    # Listar todos os materiais
POST   /materiais                    # Criar novo material (admin)
GET    /materiais/{id}               # Buscar material por ID
PUT    /materiais/{id}               # Atualizar material (admin)
DELETE /materiais/{id}               # Excluir material (admin)

GET    /movimentacoes                # Listar movimentações (todas para admin, próprias para user)
POST   /movimentacoes                # Criar nova movimentação
GET    /movimentacoes/{id}           # Buscar movimentação por ID
PUT    /movimentacoes/{id}           # Atualizar movimentação
DELETE /movimentacoes/{id}           # Excluir movimentação (admin)
PUT    /movimentacoes/{id}/devolver  # Devolver material
```

### **⚙️ 3. Passos de Deploy**

#### **Instalar Serverless Framework:**

```shellscript
npm install -g serverless
npm install
```

#### **Configurar AWS CLI:**

```shellscript
aws configure
```

#### **Deploy da API:**

```shellscript
serverless deploy
```

#### **Popular banco de dados:**

```shellscript
npm run populate
```

### **🔧 4. Configurações no Frontend**

**Atualizar `script.js`:**

```javascript
// Substituir a URL da API
const API_BASE_URL = "https://sua-api-id.execute-api.us-east-1.amazonaws.com/dev";
```

### **🛡️ 5. Autenticação e Autorização**

- ✅ **JWT Token** do Cognito enviado no header `Authorization`
- ✅ **Verificação de grupos** (admin vs user)
- ✅ **Controle de acesso** por endpoint
- ✅ **Validação de token** em cada requisição


### **📊 6. Funcionalidades Implementadas**

#### **Para Usuários Comuns:**

- ✅ Listar materiais disponíveis
- ✅ Registrar retirada de materiais
- ✅ Ver próprio histórico
- ✅ Devolver materiais próprios


#### **Para Administradores:**

- ✅ Todas as funcionalidades de usuário
- ✅ Cadastrar novos materiais
- ✅ Ver todas as movimentações
- ✅ Gerenciar estoque
- ✅ Devolver qualquer material


### **💰 7. Custos AWS (Estimativa)**

- **Lambda:** ~$0.20/milhão de requests
- **DynamoDB:** Pay-per-request (~$1.25/milhão)
- **API Gateway:** ~$3.50/milhão de requests
- **Cognito:** Gratuito até 50k usuários


### **🔄 8. Próximos Passos**

1. **Testar todas as rotas** no Postman
2. **Configurar domínio customizado** (opcional)
3. **Implementar logs** com CloudWatch
4. **Adicionar validações** mais robustas
5. **Implementar cache** com ElastiCache (opcional)


O sistema agora está completamente serverless e escalável! 🎉

To configure the generation, complete these steps: