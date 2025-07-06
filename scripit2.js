// Importação do AmazonCognitoIdentity e AWS SDK
const AmazonCognitoIdentity = window["AmazonCognitoIdentity"]
const AWS = window["AWS"]

// Configuração do AWS Cognito
const poolData = {
  UserPoolId: "us-east-1_XXXXXXXXX", // Substitua pelo seu User Pool ID
  ClientId: "XXXXXXXXXXXXXXXXXXXXXXXXXX", // Substitua pelo seu Client ID
}

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData)
let currentUser = null
let userRole = null
let pendingConfirmationEmail = null
let pendingAction = null

// Configuração do AWS SDK para operações administrativas
AWS.config.region = "us-east-1" // Substitua pela sua região
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX", // Substitua pelo seu Identity Pool ID
})

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider()

// Dados simulados para demonstração
let materiais = [
  // Ferramentas Mecânicas
  {
    id: 1,
    nome: "Furadeira Elétrica",
    categoria: "Ferramentas Mecânicas",
    quantidade: 2,
    unidade: "unidade",
    descricao: "Furadeira elétrica 500W com brocas variadas",
  },
  {
    id: 2,
    nome: "Serra de Mão",
    categoria: "Ferramentas Mecânicas",
    quantidade: 3,
    unidade: "unidade",
    descricao: "Serra de mão para madeira e metal",
  },
  {
    id: 3,
    nome: "Chaves de Fenda (Kit)",
    categoria: "Ferramentas Mecânicas",
    quantidade: 5,
    unidade: "kit",
    descricao: "Kit com chaves de fenda variadas",
  },
  {
    id: 4,
    nome: "Alicate Universal",
    categoria: "Ferramentas Mecânicas",
    quantidade: 4,
    unidade: "unidade",
    descricao: "Alicate universal isolado",
  },
  {
    id: 5,
    nome: "Morsa Pequena",
    categoria: "Ferramentas Mecânicas",
    quantidade: 2,
    unidade: "unidade",
    descricao: "Morsa de bancada 4 polegadas",
  },

  // Componentes Eletrônicos
  {
    id: 6,
    nome: "Resistores 220Ω",
    categoria: "Componentes Eletrônicos",
    quantidade: 100,
    unidade: "peça",
    descricao: "Resistores de 220 ohms, 1/4W",
  },
  {
    id: 7,
    nome: "Resistores 1kΩ",
    categoria: "Componentes Eletrônicos",
    quantidade: 100,
    unidade: "peça",
    descricao: "Resistores de 1k ohms, 1/4W",
  },
  {
    id: 8,
    nome: "Resistores 10kΩ",
    categoria: "Componentes Eletrônicos",
    quantidade: 100,
    unidade: "peça",
    descricao: "Resistores de 10k ohms, 1/4W",
  },
  {
    id: 9,
    nome: "Capacitores Eletrolíticos 100µF",
    categoria: "Componentes Eletrônicos",
    quantidade: 50,
    unidade: "peça",
    descricao: "Capacitores eletrolíticos 100µF/25V",
  },
  {
    id: 10,
    nome: "Capacitores Cerâmicos 100nF",
    categoria: "Componentes Eletrônicos",
    quantidade: 50,
    unidade: "peça",
    descricao: "Capacitores cerâmicos 100nF",
  },
  {
    id: 11,
    nome: "LEDs Vermelhos 5mm",
    categoria: "Componentes Eletrônicos",
    quantidade: 200,
    unidade: "peça",
    descricao: "LEDs vermelhos de 5mm, 20mA",
  },
  {
    id: 12,
    nome: "LEDs Azuis 5mm",
    categoria: "Componentes Eletrônicos",
    quantidade: 150,
    unidade: "peça",
    descricao: "LEDs azuis de 5mm, 20mA",
  },
  {
    id: 13,
    nome: "LEDs RGB",
    categoria: "Componentes Eletrônicos",
    quantidade: 30,
    unidade: "peça",
    descricao: "LEDs RGB de 5mm, catodo comum",
  },
  {
    id: 14,
    nome: "Transistores BC547",
    categoria: "Componentes Eletrônicos",
    quantidade: 50,
    unidade: "peça",
    descricao: "Transistores NPN BC547",
  },
  {
    id: 15,
    nome: "CI 555",
    categoria: "Componentes Eletrônicos",
    quantidade: 20,
    unidade: "peça",
    descricao: "Circuito integrado timer 555",
  },

  // Módulos e Sensores
  {
    id: 16,
    nome: "Sensor Ultrassônico HC-SR04",
    categoria: "Módulos e Sensores",
    quantidade: 15,
    unidade: "unidade",
    descricao: "Sensor de distância ultrassônico",
  },
  {
    id: 17,
    nome: "Sensor de Temperatura DHT22",
    categoria: "Módulos e Sensores",
    quantidade: 10,
    unidade: "unidade",
    descricao: "Sensor de temperatura e umidade",
  },
  {
    id: 18,
    nome: "Sensor PIR",
    categoria: "Módulos e Sensores",
    quantidade: 8,
    unidade: "unidade",
    descricao: "Sensor de movimento PIR",
  },
  {
    id: 19,
    nome: "Módulo Relé 5V",
    categoria: "Módulos e Sensores",
    quantidade: 12,
    unidade: "unidade",
    descricao: "Módulo relé de 1 canal 5V",
  },
  {
    id: 20,
    nome: "Display LCD 16x2",
    categoria: "Módulos e Sensores",
    quantidade: 6,
    unidade: "unidade",
    descricao: "Display LCD 16x2 com backlight",
  },
  {
    id: 21,
    nome: "Módulo Bluetooth HC-05",
    categoria: "Módulos e Sensores",
    quantidade: 5,
    unidade: "unidade",
    descricao: "Módulo Bluetooth para comunicação",
  },

  // Microcontroladores
  {
    id: 22,
    nome: "Arduino Uno R3",
    categoria: "Microcontroladores",
    quantidade: 15,
    unidade: "unidade",
    descricao: "Microcontrolador Arduino Uno R3 original",
  },
  {
    id: 23,
    nome: "Arduino Nano",
    categoria: "Microcontroladores",
    quantidade: 10,
    unidade: "unidade",
    descricao: "Arduino Nano v3.0 com cabo USB",
  },
  {
    id: 24,
    nome: "ESP32",
    categoria: "Microcontroladores",
    quantidade: 8,
    unidade: "unidade",
    descricao: "Microcontrolador ESP32 com WiFi e Bluetooth",
  },
  {
    id: 25,
    nome: "Raspberry Pi 4",
    categoria: "Microcontroladores",
    quantidade: 3,
    unidade: "unidade",
    descricao: "Raspberry Pi 4 Model B 4GB RAM",
  },

  // Materiais de Montagem
  {
    id: 26,
    nome: "Fios Jumper Macho-Macho",
    categoria: "Materiais de Montagem",
    quantidade: 10,
    unidade: "pacote",
    descricao: "Pacote com 40 fios jumper macho-macho",
  },
  {
    id: 27,
    nome: "Fios Jumper Macho-Fêmea",
    categoria: "Materiais de Montagem",
    quantidade: 8,
    unidade: "pacote",
    descricao: "Pacote com 40 fios jumper macho-fêmea",
  },
  {
    id: 28,
    nome: "Fio Rígido 22AWG",
    categoria: "Materiais de Montagem",
    quantidade: 5,
    unidade: "rolo",
    descricao: "Fio rígido 22AWG para protoboard",
  },
  {
    id: 29,
    nome: "Solda 60/40",
    categoria: "Materiais de Montagem",
    quantidade: 3,
    unidade: "rolo",
    descricao: "Solda 60/40 com fluxo, 1mm",
  },
  {
    id: 30,
    nome: "Parafusos M3",
    categoria: "Materiais de Montagem",
    quantidade: 200,
    unidade: "peça",
    descricao: "Parafusos M3 x 10mm com porcas",
  },

  // Instrumentos de Medição
  {
    id: 31,
    nome: "Multímetro Digital",
    categoria: "Instrumentos de Medição",
    quantidade: 4,
    unidade: "unidade",
    descricao: "Multímetro digital com display LCD",
  },
  {
    id: 32,
    nome: "Fonte de Alimentação Variável",
    categoria: "Instrumentos de Medição",
    quantidade: 2,
    unidade: "unidade",
    descricao: "Fonte 0-30V, 0-3A com display",
  },
  {
    id: 33,
    nome: "Ferro de Solda 40W",
    categoria: "Instrumentos de Medição",
    quantidade: 6,
    unidade: "unidade",
    descricao: "Ferro de solda 40W com suporte",
  },

  // Protoboards e Placas
  {
    id: 34,
    nome: "Protoboard 830 Pontos",
    categoria: "Protoboards e Placas",
    quantidade: 20,
    unidade: "unidade",
    descricao: "Protoboard de 830 pontos",
  },
  {
    id: 35,
    nome: "Protoboard 400 Pontos",
    categoria: "Protoboards e Placas",
    quantidade: 15,
    unidade: "unidade",
    descricao: "Protoboard mini de 400 pontos",
  },
  {
    id: 36,
    nome: "Placa Perfurada",
    categoria: "Protoboards e Placas",
    quantidade: 25,
    unidade: "peça",
    descricao: "Placa perfurada 5x7cm",
  },
  {
    id: 37,
    nome: "Shield Prototipagem Arduino",
    categoria: "Protoboards e Placas",
    quantidade: 8,
    unidade: "unidade",
    descricao: "Shield de prototipagem para Arduino Uno",
  },
]

let movimentacoes = [
  {
    id: 1,
    data: "2024-01-15",
    usuario: "Prof. João Silva",
    material: "Arduino Uno R3",
    quantidade: 2,
    finalidade: "Projeto de automação residencial",
    status: "Em uso",
  },
  {
    id: 2,
    data: "2024-01-14",
    usuario: "Maria Santos",
    material: "Sensor Ultrassônico HC-SR04",
    quantidade: 1,
    finalidade: "Experimento de medição de distância",
    status: "Devolvido",
  },
  {
    id: 3,
    data: "2024-01-13",
    usuario: "Carlos Oliveira",
    material: "Furadeira Elétrica",
    quantidade: 1,
    finalidade: "Montagem de estrutura para experimento",
    status: "Devolvido",
  },
  {
    id: 4,
    data: "2024-01-12",
    usuario: "Ana Costa",
    material: "LEDs RGB",
    quantidade: 5,
    finalidade: "Projeto de iluminação inteligente",
    status: "Em uso",
  },
  {
    id: 5,
    data: "2024-01-11",
    usuario: "Pedro Almeida",
    material: "Multímetro Digital",
    quantidade: 1,
    finalidade: "Medições em circuito de amplificador",
    status: "Devolvido",
  },
]

// Lista simulada de usuários (em produção, viria do Cognito)
let usuarios = [
  {
    email: "admin@lab.com",
    nome: "Administrador",
    status: "Confirmado",
    ultimoAcesso: "2024-01-20",
    movimentacoesAtivas: 0,
  },
  {
    email: "prof.joao@lab.com",
    nome: "Prof. João Silva",
    status: "Confirmado",
    ultimoAcesso: "2024-01-19",
    movimentacoesAtivas: 1,
  },
  {
    email: "maria.santos@lab.com",
    nome: "Maria Santos",
    status: "Confirmado",
    ultimoAcesso: "2024-01-18",
    movimentacoesAtivas: 0,
  },
  {
    email: "carlos.oliveira@lab.com",
    nome: "Carlos Oliveira",
    status: "Confirmado",
    ultimoAcesso: "2024-01-17",
    movimentacoesAtivas: 0,
  },
  {
    email: "ana.costa@lab.com",
    nome: "Ana Costa",
    status: "Confirmado",
    ultimoAcesso: "2024-01-16",
    movimentacoesAtivas: 1,
  },
  {
    email: "pedro.almeida@lab.com",
    nome: "Pedro Almeida",
    status: "Pendente",
    ultimoAcesso: "Nunca",
    movimentacoesAtivas: 0,
  },
]

// Funções de persistência de dados
function saveDataToStorage() {
  try {
    localStorage.setItem("laboratorio_materiais", JSON.stringify(materiais))
    localStorage.setItem("laboratorio_movimentacoes", JSON.stringify(movimentacoes))
    localStorage.setItem("laboratorio_usuarios", JSON.stringify(usuarios))
    console.log("Dados salvos no localStorage")
  } catch (error) {
    console.error("Erro ao salvar dados:", error)
  }
}

function loadDataFromStorage() {
  try {
    const savedMateriais = localStorage.getItem("laboratorio_materiais")
    const savedMovimentacoes = localStorage.getItem("laboratorio_movimentacoes")
    const savedUsuarios = localStorage.getItem("laboratorio_usuarios")

    if (savedMateriais) {
      materiais = JSON.parse(savedMateriais)
      console.log("Materiais carregados:", materiais.length)
    }

    if (savedMovimentacoes) {
      movimentacoes = JSON.parse(savedMovimentacoes)
      console.log("Movimentações carregadas:", movimentacoes.length)
    }

    if (savedUsuarios) {
      usuarios = JSON.parse(savedUsuarios)
      console.log("Usuários carregados:", usuarios.length)
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error)
  }
}

function clearStorage() {
  localStorage.removeItem("laboratorio_materiais")
  localStorage.removeItem("laboratorio_movimentacoes")
  localStorage.removeItem("laboratorio_usuarios")
  console.log("Dados limpos do localStorage")
}

// Navegação
function navigate(hash) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })

  const currentScreen = document.getElementById(hash.replace("#", ""))
  if (currentScreen) {
    currentScreen.classList.add("active")
  }

  window.location.hash = hash
}

// Verificar autenticação e grupos
function checkAuth() {
  const cognitoUser = userPool.getCurrentUser()

  if (cognitoUser) {
    cognitoUser.getSession((err, session) => {
      if (err) {
        navigate("login")
        return
      }

      if (session.isValid()) {
        currentUser = cognitoUser

        getUserGroups(session)
          .then((groups) => {
            console.log("Grupos do usuário:", groups)
            userRole = groups.includes("Administrators") ? "admin" : "user"
            console.log("Role determinado:", userRole)

            cognitoUser.getUserAttributes((err, attributes) => {
              if (!err && attributes) {
                const emailAttr = attributes.find((attr) => attr.Name === "email")
                const nameAttr = attributes.find((attr) => attr.Name === "name")

                const userName = nameAttr ? nameAttr.Value : emailAttr ? emailAttr.Value : "Usuário"
                document.getElementById("user-name").textContent = userName
                document.getElementById("admin-name").textContent = userName

                // Atualizar informações do perfil
                updateProfileInfo(emailAttr ? emailAttr.Value : "", userName)

                loadDataFromStorage()
              }

              navigate(userRole === "admin" ? "dashboard-admin" : "dashboard-user")
              loadDashboardData()
            })
          })
          .catch((error) => {
            console.error("Erro ao obter grupos:", error)
            cognitoUser.getUserAttributes((err, attributes) => {
              if (!err && attributes) {
                const emailAttr = attributes.find((attr) => attr.Name === "email")
                userRole = emailAttr && emailAttr.Value.includes("admin") ? "admin" : "user"
                console.log("Role fallback:", userRole)

                const nameAttr = attributes.find((attr) => attr.Name === "name")
                const userName = nameAttr ? nameAttr.Value : emailAttr ? emailAttr.Value : "Usuário"
                document.getElementById("user-name").textContent = userName
                document.getElementById("admin-name").textContent = userName

                updateProfileInfo(emailAttr ? emailAttr.Value : "", userName)

                loadDataFromStorage()
                navigate(userRole === "admin" ? "dashboard-admin" : "dashboard-user")
                loadDashboardData()
              }
            })
          })
      } else {
        navigate("login")
      }
    })
  } else {
    navigate("login")
  }
}

// Função para obter grupos do usuário
function getUserGroups(session) {
  try {
    const accessToken = session.getAccessToken().getJwtToken()
    const payload = JSON.parse(atob(accessToken.split(".")[1]))

    const groups = payload["cognito:groups"] || []
    console.log("Grupos encontrados:", groups)
    return Promise.resolve(groups)
  } catch (error) {
    console.error("Erro ao decodificar token:", error)
    return Promise.resolve([])
  }
}

// Atualizar informações do perfil
function updateProfileInfo(email, name) {
  document.getElementById("profile-name").textContent = name
  document.getElementById("profile-email").textContent = email
  document.getElementById("profile-role").textContent = userRole === "admin" ? "Administrador" : "Usuário Comum"

  // Contar movimentações ativas do usuário
  const activeMovements = movimentacoes.filter((mov) => mov.usuario === name && mov.status === "Em uso").length

  document.getElementById("profile-active-movements").textContent = activeMovements
}

// Login
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value

  showLoading("login-loading", true)
  clearAlert("login-alert")

  const authenticationData = {
    Username: email,
    Password: password,
  }

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData)

  const userData = {
    Username: email,
    Pool: userPool,
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (result) => {
      showLoading("login-loading", false)
      currentUser = cognitoUser
      checkAuth()
    },
    onFailure: (err) => {
      showLoading("login-loading", false)
      showAlert("login-alert", "Erro no login: " + err.message, "error")
    },
    newPasswordRequired: (userAttributes, requiredAttributes) => {
      showLoading("login-loading", false)
      showAlert("login-alert", "Nova senha necessária. Entre em contato com o administrador.", "info")
    },
  })
})

// Cadastro
document.getElementById("cadastro-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const nome = document.getElementById("cadastro-nome").value
  const email = document.getElementById("cadastro-email").value
  const password = document.getElementById("cadastro-password").value

  showLoading("cadastro-loading", true)
  clearAlert("cadastro-alert")

  const attributeList = []

  const dataEmail = {
    Name: "email",
    Value: email,
  }

  const dataName = {
    Name: "name",
    Value: nome,
  }

  const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail)
  const attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName)

  attributeList.push(attributeEmail)
  attributeList.push(attributeName)

  userPool.signUp(email, password, attributeList, null, (err, result) => {
    showLoading("cadastro-loading", false)

    if (err) {
      showAlert("cadastro-alert", "Erro no cadastro: " + err.message, "error")
      return
    }

    // Adicionar usuário à lista local
    usuarios.push({
      email: email,
      nome: nome,
      status: "Pendente",
      ultimoAcesso: "Nunca",
      movimentacoesAtivas: 0,
    })
    saveDataToStorage()

    pendingConfirmationEmail = email
    showAlert("cadastro-alert", "Cadastro realizado! Verifique seu email para o código de confirmação.", "success")

    setTimeout(() => {
      navigate("confirmacao")
    }, 2000)
  })
})

// Confirmação
document.getElementById("confirmacao-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const codigo = document.getElementById("confirmacao-codigo").value

  if (!pendingConfirmationEmail) {
    showAlert("confirmacao-alert", "Erro: Email de confirmação não encontrado.", "error")
    return
  }

  showLoading("confirmacao-loading", true)
  clearAlert("confirmacao-alert")

  const userData = {
    Username: pendingConfirmationEmail,
    Pool: userPool,
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)

  cognitoUser.confirmRegistration(codigo, true, (err, result) => {
    showLoading("confirmacao-loading", false)

    if (err) {
      showAlert("confirmacao-alert", "Erro na confirmação: " + err.message, "error")
      return
    }

    // Atualizar status do usuário
    const usuario = usuarios.find((u) => u.email === pendingConfirmationEmail)
    if (usuario) {
      usuario.status = "Confirmado"
      saveDataToStorage()
    }

    showAlert("confirmacao-alert", "Conta confirmada com sucesso! Você pode fazer login agora.", "success")

    setTimeout(() => {
      navigate("login")
      pendingConfirmationEmail = null
    }, 2000)
  })
})

// Reenviar código
function reenviarCodigo() {
  if (!pendingConfirmationEmail) {
    showAlert("confirmacao-alert", "Erro: Email não encontrado.", "error")
    return
  }

  const userData = {
    Username: pendingConfirmationEmail,
    Pool: userPool,
  }

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData)

  cognitoUser.resendConfirmationCode((err, result) => {
    if (err) {
      showAlert("confirmacao-alert", "Erro ao reenviar código: " + err.message, "error")
      return
    }

    showAlert("confirmacao-alert", "Código reenviado com sucesso!", "success")
  })
}

// Logout
function logout() {
  if (currentUser) {
    currentUser.signOut()
  }
  currentUser = null
  userRole = null
  navigate("login")
}

// Troca de abas
function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active")
  })

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active")
  })

  event.target.classList.add("active")
  document.getElementById("tab-" + tabName).classList.add("active")

  // Carregar dados específicos da aba
  if (tabName === "usuarios" && userRole === "admin") {
    loadUsuarios()
  }
}

// Carregar dados do dashboard
function loadDashboardData() {
  if (userRole === "admin") {
    loadEstoque()
    loadMovimentacoes()
    loadUsuarios()
  } else {
    loadMateriais()
    loadHistoricoUsuario()
  }
}

// Carregar materiais para seleção
function loadMateriais() {
  const select = document.getElementById("material-select")
  select.innerHTML = '<option value="">Selecione um material...</option>'

  materiais.forEach((material) => {
    if (material.quantidade > 0) {
      const option = document.createElement("option")
      option.value = material.id
      option.textContent = `${material.nome} (${material.quantidade} ${material.unidade} disponível)`
      select.appendChild(option)
    }
  })
}

// Carregar estoque (admin)
function loadEstoque() {
  const tbody = document.getElementById("estoque-tbody")
  tbody.innerHTML = ""

  materiais.forEach((material) => {
    const row = document.createElement("tr")
    const status = material.quantidade > 10 ? "Disponível" : material.quantidade > 0 ? "Baixo Estoque" : "Esgotado"
    const statusClass = material.quantidade > 10 ? "success" : material.quantidade > 0 ? "warning" : "error"

    row.innerHTML = `
            <td>${material.id}</td>
            <td>${material.nome}</td>
            <td>${material.categoria}</td>
            <td>${material.quantidade} ${material.unidade}</td>
            <td>${material.descricao}</td>
            <td><span class="alert-${statusClass}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></td>
        `
    tbody.appendChild(row)
  })
}

// Carregar movimentações (admin)
function loadMovimentacoes() {
  const tbody = document.getElementById("movimentacoes-tbody")
  tbody.innerHTML = ""

  movimentacoes.forEach((mov) => {
    const row = document.createElement("tr")
    const statusClass = mov.status === "Devolvido" ? "status-returned" : "status-active"

    row.innerHTML = `
            <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
            <td>${mov.usuario}</td>
            <td>${mov.material}</td>
            <td>${mov.quantidade}</td>
            <td>${mov.finalidade}</td>
            <td><span class="status-badge ${statusClass}">${mov.status}</span></td>
            <td>
                ${
                  mov.status === "Em uso"
                    ? `<button class="btn-success" onclick="returnMaterial(${mov.id})">Devolver</button>`
                    : '<span style="color: #666;">-</span>'
                }
            </td>
        `
    tbody.appendChild(row)
  })
}

// Carregar histórico do usuário
function loadHistoricoUsuario() {
  const tbody = document.getElementById("historico-tbody")
  tbody.innerHTML = ""

  const userName = document.getElementById("user-name").textContent
  const userMovs = movimentacoes.filter((mov) => mov.usuario === userName)

  console.log("Carregando histórico para:", userName)
  console.log("Movimentações encontradas:", userMovs.length)

  if (userMovs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: #666;">Nenhuma movimentação encontrada</td></tr>'
    return
  }

  userMovs.sort((a, b) => new Date(b.data) - new Date(a.data))

  userMovs.forEach((mov) => {
    const row = document.createElement("tr")
    const statusClass = mov.status === "Devolvido" ? "status-returned" : "status-active"

    row.innerHTML = `
            <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
            <td>${mov.material}</td>
            <td>${mov.quantidade}</td>
            <td>${mov.finalidade}</td>
            <td><span class="status-badge ${statusClass}">${mov.status}</span></td>
            <td>
                ${
                  mov.status === "Em uso"
                    ? `<button class="btn-success" onclick="returnMaterial(${mov.id})">Devolver</button>`
                    : '<span style="color: #666;">-</span>'
                }
            </td>
        `
    tbody.appendChild(row)
  })
}

// Carregar usuários diretamente do Cognito (admin)
async function loadUsuarios() {
  const tbody = document.getElementById("usuarios-tbody")
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Carregando usuários...</td></tr>'

  try {
    // Buscar usuários do Cognito
    const params = {
      UserPoolId: poolData.UserPoolId,
      Limit: 60, // Máximo de usuários por página
    }

    const result = await cognitoIdentityServiceProvider.listUsers(params).promise()
    tbody.innerHTML = ""

    if (result.Users.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align: center; color: #666;">Nenhum usuário encontrado</td></tr>'
      return
    }

    // Processar cada usuário
    for (const user of result.Users) {
      const email = user.Attributes.find((attr) => attr.Name === "email")?.Value || "N/A"
      const name = user.Attributes.find((attr) => attr.Name === "name")?.Value || email
      const status =
        user.UserStatus === "CONFIRMED"
          ? "Confirmado"
          : user.UserStatus === "UNCONFIRMED"
            ? "Pendente"
            : user.UserStatus

      // Contar movimentações ativas
      const activeMovements = movimentacoes.filter(
        (mov) => (mov.usuario === name || mov.usuario === email) && mov.status === "Em uso",
      ).length

      const lastLogin = user.UserLastModifiedDate
        ? new Date(user.UserLastModifiedDate).toLocaleDateString("pt-BR")
        : "Nunca"

      const row = document.createElement("tr")
      const statusClass = status === "Confirmado" ? "status-confirmed" : "status-pending"

      row.innerHTML = `
                <td>${name}</td>
                <td>${email}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>${activeMovements}</td>
                <td>${lastLogin}</td>
                <td>
                    ${
                      activeMovements === 0 && email !== currentUser?.getUsername()
                        ? `<button class="btn-danger" onclick="deleteUserFromCognito('${email}', '${name}')">Excluir</button>`
                        : activeMovements > 0
                          ? '<span style="color: #666;">Tem materiais pendentes</span>'
                          : '<span style="color: #666;">Usuário atual</span>'
                    }
                </td>
            `
      tbody.appendChild(row)
    }
  } catch (error) {
    console.error("Erro ao carregar usuários:", error)
    tbody.innerHTML =
      '<tr><td colspan="6" style="text-align: center; color: #f00;">Erro ao carregar usuários. Verifique as permissões.</td></tr>'

    if (error.code === "NotAuthorizedException") {
      showAlert(
        "usuarios-alert",
        "Erro: Sem permissão para listar usuários. Configure as credenciais de administrador.",
        "error",
      )
    } else {
      showAlert("usuarios-alert", `Erro ao carregar usuários: ${error.message}`, "error")
    }
  }
}

// Cadastrar material (admin)
document.getElementById("material-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const nome = document.getElementById("material-nome").value
  const categoria = document.getElementById("material-categoria").value
  const quantidade = Number.parseInt(document.getElementById("material-quantidade").value)
  const unidade = document.getElementById("material-unidade").value
  const descricao = document.getElementById("material-descricao").value

  const novoMaterial = {
    id: Date.now(),
    nome,
    categoria,
    quantidade,
    unidade,
    descricao,
  }

  materiais.push(novoMaterial)
  saveDataToStorage()

  showAlert("cadastrar-alert", "Material cadastrado com sucesso!", "success")
  document.getElementById("material-form").reset()

  loadEstoque()
  loadMateriais()
})

// Registrar retirada
document.getElementById("retirada-form").addEventListener("submit", (e) => {
  e.preventDefault()

  const materialId = Number.parseInt(document.getElementById("material-select").value)
  const quantidade = Number.parseInt(document.getElementById("quantidade-retirada").value)
  const finalidade = document.getElementById("finalidade").value
  const tempoUso = Number.parseInt(document.getElementById("tempo-uso").value)
  const observacoes = document.getElementById("observacoes").value

  const material = materiais.find((m) => m.id === materialId)

  if (!material) {
    showAlert("retirada-alert", "Material não encontrado.", "error")
    return
  }

  if (quantidade > material.quantidade) {
    showAlert("retirada-alert", "Quantidade solicitada maior que disponível em estoque.", "error")
    return
  }

  material.quantidade -= quantidade

  const userName = document.getElementById("user-name").textContent
  const novaMovimentacao = {
    id: Date.now(),
    data: new Date().toISOString().split("T")[0],
    usuario: userName,
    material: material.nome,
    quantidade,
    finalidade,
    status: "Em uso",
    observacoes: observacoes || "",
    tempoUso: tempoUso,
  }

  movimentacoes.push(novaMovimentacao)

  // Atualizar contador de movimentações ativas do usuário
  const usuario = usuarios.find((u) => u.nome === userName)
  if (usuario) {
    usuario.movimentacoesAtivas++
  }

  saveDataToStorage()

  console.log("Nova movimentação registrada:", novaMovimentacao)
  console.log("Total de movimentações:", movimentacoes.length)

  showAlert("retirada-alert", "Retirada registrada com sucesso!", "success")
  document.getElementById("retirada-form").reset()

  loadMateriais()
  loadHistoricoUsuario()
  updateProfileInfo(document.getElementById("profile-email").textContent, userName)

  if (userRole === "admin") {
    loadEstoque()
    loadMovimentacoes()
    loadUsuarios()
  }
})

// Devolver material
function returnMaterial(movimentacaoId) {
  const movimentacao = movimentacoes.find((m) => m.id === movimentacaoId)
  if (!movimentacao) {
    alert("Movimentação não encontrada.")
    return
  }

  if (movimentacao.status === "Devolvido") {
    alert("Material já foi devolvido.")
    return
  }

  // Confirmar devolução
  if (!confirm(`Confirmar devolução de ${movimentacao.quantidade} ${movimentacao.material}?`)) {
    return
  }

  // Atualizar status da movimentação
  movimentacao.status = "Devolvido"

  // Devolver material ao estoque
  const material = materiais.find((m) => m.nome === movimentacao.material)
  if (material) {
    material.quantidade += movimentacao.quantidade
  }

  // Atualizar contador de movimentações ativas do usuário
  const usuario = usuarios.find((u) => u.nome === movimentacao.usuario)
  if (usuario && usuario.movimentacoesAtivas > 0) {
    usuario.movimentacoesAtivas--
  }

  saveDataToStorage()

  // Recarregar dados
  if (userRole === "admin") {
    loadEstoque()
    loadMovimentacoes()
    loadUsuarios()
  } else {
    loadMateriais()
    loadHistoricoUsuario()
    updateProfileInfo(
      document.getElementById("profile-email").textContent,
      document.getElementById("user-name").textContent,
    )
  }

  alert("Material devolvido com sucesso!")
}

// Deletar conta do usuário (implementação real)
function deleteUserAccount() {
  const userName = document.getElementById("user-name").textContent
  const userEmail = document.getElementById("profile-email").textContent

  // Verificar se há movimentações pendentes
  const activeMovements = movimentacoes.filter(
    (mov) => (mov.usuario === userName || mov.usuario === userEmail) && mov.status === "Em uso",
  )

  if (activeMovements.length > 0) {
    showModal(
      "Não é possível excluir conta",
      "Você possui materiais que ainda não foram devolvidos. Devolva todos os materiais antes de excluir sua conta.",
      `<strong>Materiais pendentes:</strong>
            <ul>
                ${activeMovements.map((mov) => `<li>${mov.material} (${mov.quantidade})</li>`).join("")}
            </ul>`,
      null,
    )
    return
  }

  showModal(
    "⚠️ Excluir Conta",
    "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
    "<strong>Consequências:</strong><br>• Sua conta será permanentemente removida do Cognito<br>• Você perderá acesso ao sistema<br>• Seu histórico será mantido para fins de auditoria",
    () => executeSelfDeleteAccount(userEmail, userName),
  )
}

// Executar auto-exclusão da conta
async function executeSelfDeleteAccount(email, nome) {
  try {
    showAlert("perfil-alert", "Excluindo conta...", "info")

    // Usuário pode deletar a própria conta
    await currentUser.deleteUser((err, result) => {
      if (err) {
        console.error("Erro ao excluir própria conta:", err)
        showAlert("perfil-alert", `Erro ao excluir conta: ${err.message}`, "error")
        return
      }

      // Marcar movimentações como de usuário excluído
      movimentacoes.forEach((mov) => {
        if (mov.usuario === nome || mov.usuario === email) {
          mov.usuarioExcluido = true
        }
      })

      saveDataToStorage()

      showAlert("perfil-alert", "Conta excluída com sucesso. Você será desconectado.", "success")

      setTimeout(() => {
        logout()
      }, 2000)
    })
  } catch (error) {
    console.error("Erro ao excluir própria conta:", error)
    showAlert("perfil-alert", "Erro ao excluir conta. Tente novamente.", "error")
  }
}

// Deletar usuário do Cognito (implementação real)
async function deleteUserFromCognito(email, nome) {
  // Verificar se há movimentações pendentes
  const activeMovements = movimentacoes.filter(
    (mov) => (mov.usuario === nome || mov.usuario === email) && mov.status === "Em uso",
  )

  if (activeMovements.length > 0) {
    showModal(
      "Não é possível excluir usuário",
      `O usuário ${nome} possui materiais que ainda não foram devolvidos.`,
      `<strong>Materiais pendentes:</strong>
            <ul>
                ${activeMovements.map((mov) => `<li>${mov.material} (${mov.quantidade})</li>`).join("")}
            </ul>`,
      null,
    )
    return
  }

  showModal(
    "⚠️ Excluir Usuário",
    `Tem certeza que deseja excluir o usuário ${nome}?`,
    "<strong>Consequências:</strong><br>• A conta será permanentemente removida do Cognito<br>• O usuário perderá acesso ao sistema<br>• O histórico será mantido para fins de auditoria",
    () => executeDeleteUserFromCognito(email, nome),
  )
}

// Executar exclusão real do usuário no Cognito
async function executeDeleteUserFromCognito(email, nome) {
  try {
    showAlert("usuarios-alert", "Excluindo usuário...", "info")

    const params = {
      UserPoolId: poolData.UserPoolId,
      Username: email,
    }

    await cognitoIdentityServiceProvider.adminDeleteUser(params).promise()

    // Remover das movimentações locais (manter histórico mas marcar como usuário excluído)
    movimentacoes.forEach((mov) => {
      if (mov.usuario === nome || mov.usuario === email) {
        mov.usuarioExcluido = true
      }
    })

    saveDataToStorage()

    showAlert("usuarios-alert", `Usuário ${nome} excluído com sucesso do Cognito.`, "success")

    // Recarregar lista de usuários
    setTimeout(() => {
      loadUsuarios()
    }, 1000)
  } catch (error) {
    console.error("Erro ao excluir usuário do Cognito:", error)

    let errorMessage = "Erro ao excluir usuário. "

    if (error.code === "NotAuthorizedException") {
      errorMessage += "Sem permissão para excluir usuários. Configure as credenciais de administrador."
    } else if (error.code === "UserNotFoundException") {
      errorMessage += "Usuário não encontrado no Cognito."
    } else {
      errorMessage += error.message
    }

    showAlert("usuarios-alert", errorMessage, "error")
  }
}

// Modal functions
function showModal(title, message, details, confirmCallback) {
  document.getElementById("modal-title").textContent = title
  document.getElementById("modal-message").textContent = message
  document.getElementById("modal-details").innerHTML = details || ""

  const confirmBtn = document.getElementById("modal-confirm-btn")
  if (confirmCallback) {
    confirmBtn.style.display = "inline-block"
    pendingAction = confirmCallback
  } else {
    confirmBtn.style.display = "none"
    pendingAction = null
  }

  document.getElementById("confirmation-modal").style.display = "block"
}

function closeModal() {
  document.getElementById("confirmation-modal").style.display = "none"
  pendingAction = null
}

function confirmAction() {
  if (pendingAction) {
    pendingAction()
    pendingAction = null
  }
  closeModal()
}

// Funções auxiliares
function showAlert(elementId, message, type) {
  const alertElement = document.getElementById(elementId)
  alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`
}

function clearAlert(elementId) {
  document.getElementById(elementId).innerHTML = ""
}

function showLoading(elementId, show) {
  const loadingElement = document.getElementById(elementId)
  if (show) {
    loadingElement.style.display = "block"
  } else {
    loadingElement.style.display = "none"
  }
}

// Função de debug
function debugData() {
  console.log("=== DEBUG DE DADOS ===")
  console.log("Usuário atual:", currentUser ? currentUser.getUsername() : "Nenhum")
  console.log("Role do usuário:", userRole)
  console.log("Total de materiais:", materiais.length)
  console.log("Materiais:", materiais)
  console.log("Total de movimentações:", movimentacoes.length)
  console.log("Movimentações:", movimentacoes)
  console.log("Total de usuários:", usuarios.length)
  console.log("Usuários:", usuarios)
  console.log("LocalStorage materiais:", localStorage.getItem("laboratorio_materiais"))
  console.log("LocalStorage movimentações:", localStorage.getItem("laboratorio_movimentacoes"))
  console.log("LocalStorage usuários:", localStorage.getItem("laboratorio_usuarios"))

  alert(`Debug concluído! Verifique o console do navegador.
    
Resumo:
- Materiais: ${materiais.length}
- Movimentações: ${movimentacoes.length}
- Usuários: ${usuarios.length}
- Role: ${userRole}
- Usuário: ${currentUser ? currentUser.getUsername() : "Nenhum"}`)
}

// Inicialização
window.addEventListener("load", () => {
  loadDataFromStorage()

  const hash = window.location.hash || "#login"

  if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
    navigate(hash)
  } else {
    checkAuth()
  }
})

window.addEventListener("hashchange", () => {
  const hash = window.location.hash

  if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
    navigate(hash)
  }
})

// Fechar modal ao clicar fora dele
window.addEventListener("click", (event) => {
  const modal = document.getElementById("confirmation-modal")
  if (event.target === modal) {
    closeModal()
  }
})

setTimeout(() => {
  loadMateriais()
}, 1000)
