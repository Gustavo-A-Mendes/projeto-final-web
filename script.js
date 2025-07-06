// Configuração do AWS Cognito
const poolData = {
  UserPoolId: "us-east-1_lx4uauG61", // Substitua pelo seu User Pool ID
  ClientId: "4m4pllmlt8rtc8sul5nhnrnf0e", // Substitua pelo seu Client ID
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
let currentUser = null;
let userRole = null;
let pendingConfirmationEmail = null;

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
];

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
];

// Funções de persistência de dados
function saveDataToStorage() {
  try {
    localStorage.setItem("laboratorio_materiais", JSON.stringify(materiais));
    localStorage.setItem(
      "laboratorio_movimentacoes",
      JSON.stringify(movimentacoes)
    );
    console.log("Dados salvos no localStorage");
  } catch (error) {
    console.error("Erro ao salvar dados:", error);
  }
}

function loadDataFromStorage() {
  try {
    const savedMateriais = localStorage.getItem("laboratorio_materiais");
    const savedMovimentacoes = localStorage.getItem(
      "laboratorio_movimentacoes"
    );

    if (savedMateriais) {
      materiais = JSON.parse(savedMateriais);
      console.log("Materiais carregados:", materiais.length);
    }

    if (savedMovimentacoes) {
      movimentacoes = JSON.parse(savedMovimentacoes);
      console.log("Movimentações carregadas:", movimentacoes.length);
    }
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    // Manter dados padrão em caso de erro
  }
}

function clearStorage() {
  localStorage.removeItem("laboratorio_materiais");
  localStorage.removeItem("laboratorio_movimentacoes");
  console.log("Dados limpos do localStorage");
}

// Navegação
function navigate(hash) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const currentScreen = document.getElementById(hash.replace("#", ""));
  if (currentScreen) {
    currentScreen.classList.add("active");
  }

  window.location.hash = hash;
}

// Verificar autenticação e grupos (versão corrigida)
function checkAuth() {
  const cognitoUser = userPool.getCurrentUser();

  if (cognitoUser) {
    cognitoUser.getSession((err, session) => {
      if (err) {
        navigate("login");
        return;
      }

      if (session.isValid()) {
        currentUser = cognitoUser;

        // Obter grupos do usuário (versão melhorada)
        getUserGroups(session)
          .then((groups) => {
            console.log("Grupos do usuário:", groups);
            // Verificar se é admin baseado nos grupos
            userRole = groups.includes("Administrador") ? "admin" : "user";
            console.log("Role determinado:", userRole);

            // Obter atributos do usuário
            cognitoUser.getUserAttributes((err, attributes) => {
              if (!err && attributes) {
                const emailAttr = attributes.find(
                  (attr) => attr.Name === "email"
                );
                const nameAttr = attributes.find(
                  (attr) => attr.Name === "name"
                );

                const userName = nameAttr
                  ? nameAttr.Value
                  : emailAttr
                  ? emailAttr.Value
                  : "Usuário";
                document.getElementById("user-name").textContent = userName;
                document.getElementById("admin-name").textContent = userName;

                // Forçar refresh dos dados
                loadDataFromStorage();
              }

              // Navegar para dashboard apropriado
              navigate(
                userRole === "admin" ? "dashboard-admin" : "dashboard-user"
              );
              loadDashboardData();
            });
          })
          .catch((error) => {
            console.error("Erro ao obter grupos:", error);
            // Fallback: usar role baseado no email
            cognitoUser.getUserAttributes((err, attributes) => {
              if (!err && attributes) {
                const emailAttr = attributes.find(
                  (attr) => attr.Name === "email"
                );
                userRole =
                  emailAttr && emailAttr.Value.includes("admin")
                    ? "admin"
                    : "user";
                console.log("Role fallback:", userRole);

                const nameAttr = attributes.find(
                  (attr) => attr.Name === "name"
                );
                const userName = nameAttr
                  ? nameAttr.Value
                  : emailAttr
                  ? emailAttr.Value
                  : "Usuário";
                document.getElementById("user-name").textContent = userName;
                document.getElementById("admin-name").textContent = userName;

                loadDataFromStorage();
                navigate(
                  userRole === "admin" ? "dashboard-admin" : "dashboard-user"
                );
                loadDashboardData();
              }
            });
          });
      } else {
        navigate("login");
      }
    });
  } else {
    navigate("login");
  }
}

// Função melhorada para obter grupos do usuário
function getUserGroups(session) {
  try {
    // Obter grupos do token de acesso
    const accessToken = session.getAccessToken().getJwtToken();
    const payload = JSON.parse(atob(accessToken.split(".")[1]));

    // Grupos estão no campo 'cognito:groups'
    const groups = payload["cognito:groups"] || [];
    console.log("Grupos encontrados:", groups);
    return Promise.resolve(groups);
  } catch (error) {
    console.error("Erro ao decodificar token:", error);
    return Promise.resolve([]);
  }
}

// Login
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  showLoading("login-loading", true);
  clearAlert("login-alert");

  const authenticationData = {
    Username: email,
    Password: password,
  };

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    authenticationData
  );

  const userData = {
    Username: email,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      showLoading("login-loading", false);
      currentUser = cognitoUser;

      // Verificar grupos e redirecionar
      checkAuth();
    },
    onFailure: function (err) {
      showLoading("login-loading", false);
      showAlert("login-alert", "Erro no login: " + err.message, "error");
    },
    newPasswordRequired: function (userAttributes, requiredAttributes) {
      showLoading("login-loading", false);
      showAlert(
        "login-alert",
        "Nova senha necessária. Entre em contato com o administrador.",
        "info"
      );
    },
  });
});

// Cadastro (simplificado - sem atributo customizado)
document
  .getElementById("cadastro-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("cadastro-nome").value;
    const email = document.getElementById("cadastro-email").value;
    const password = document.getElementById("cadastro-password").value;

    showLoading("cadastro-loading", true);
    clearAlert("cadastro-alert");

    const attributeList = [];

    const dataEmail = {
      Name: "email",
      Value: email,
    };

    const dataName = {
      Name: "name",
      Value: nome,
    };

    const attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(
      dataEmail
    );
    const attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(
      dataName
    );

    attributeList.push(attributeEmail);
    attributeList.push(attributeName);

    userPool.signUp(
      email,
      password,
      attributeList,
      null,
      function (err, result) {
        showLoading("cadastro-loading", false);

        if (err) {
          showAlert(
            "cadastro-alert",
            "Erro no cadastro: " + err.message,
            "error"
          );
          return;
        }

        pendingConfirmationEmail = email;
        showAlert(
          "cadastro-alert",
          "Cadastro realizado! Verifique seu email para o código de confirmação.",
          "success"
        );

        setTimeout(() => {
          navigate("confirmacao");
        }, 2000);
      }
    );
  });

// Confirmação
document
  .getElementById("confirmacao-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const codigo = document.getElementById("confirmacao-codigo").value;

    if (!pendingConfirmationEmail) {
      showAlert(
        "confirmacao-alert",
        "Erro: Email de confirmação não encontrado.",
        "error"
      );
      return;
    }

    showLoading("confirmacao-loading", true);
    clearAlert("confirmacao-alert");

    const userData = {
      Username: pendingConfirmationEmail,
      Pool: userPool,
    };

    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmRegistration(codigo, true, function (err, result) {
      showLoading("confirmacao-loading", false);

      if (err) {
        showAlert(
          "confirmacao-alert",
          "Erro na confirmação: " + err.message,
          "error"
        );
        return;
      }

      showAlert(
        "confirmacao-alert",
        "Conta confirmada com sucesso! Você pode fazer login agora.",
        "success"
      );

      setTimeout(() => {
        navigate("login");
        pendingConfirmationEmail = null;
      }, 2000);
    });
  });

// Reenviar código
function reenviarCodigo() {
  if (!pendingConfirmationEmail) {
    showAlert("confirmacao-alert", "Erro: Email não encontrado.", "error");
    return;
  }

  const userData = {
    Username: pendingConfirmationEmail,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.resendConfirmationCode(function (err, result) {
    if (err) {
      showAlert(
        "confirmacao-alert",
        "Erro ao reenviar código: " + err.message,
        "error"
      );
      return;
    }

    showAlert("confirmacao-alert", "Código reenviado com sucesso!", "success");
  });
}

// Logout
function logout() {
  if (currentUser) {
    currentUser.signOut();
  }
  currentUser = null;
  userRole = null;
  navigate("login");
}

// Troca de abas
function switchTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  event.target.classList.add("active");
  document.getElementById("tab-" + tabName).classList.add("active");
}

// Carregar dados do dashboard
function loadDashboardData() {
  if (userRole === "admin") {
    loadEstoque();
    loadMovimentacoes();
  } else {
    loadMateriais();
    loadHistoricoUsuario();
  }
}

// Carregar materiais para seleção
function loadMateriais() {
  const select = document.getElementById("material-select");
  select.innerHTML = '<option value="">Selecione um material...</option>';

  materiais.forEach((material) => {
    if (material.quantidade > 0) {
      const option = document.createElement("option");
      option.value = material.id;
      option.textContent = `${material.nome} (${material.quantidade} ${material.unidade} disponível)`;
      select.appendChild(option);
    }
  });
}

// Carregar estoque (admin)
function loadEstoque() {
  const tbody = document.getElementById("estoque-tbody");
  tbody.innerHTML = "";

  materiais.forEach((material) => {
    const row = document.createElement("tr");
    const status =
      material.quantidade > 10
        ? "Disponível"
        : material.quantidade > 0
        ? "Baixo Estoque"
        : "Esgotado";
    const statusClass =
      material.quantidade > 10
        ? "success"
        : material.quantidade > 0
        ? "warning"
        : "error";

    row.innerHTML = `
                    <td>${material.id}</td>
                    <td>${material.nome}</td>
                    <td>${material.categoria}</td>
                    <td>${material.quantidade} ${material.unidade}</td>
                    <td>${material.descricao}</td>
                    <td><span class="alert-${statusClass}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></td>
                `;
    tbody.appendChild(row);
  });
}

// Carregar movimentações (admin)
function loadMovimentacoes() {
  const tbody = document.getElementById("movimentacoes-tbody");
  tbody.innerHTML = "";

  movimentacoes.forEach((mov) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
                    <td>${mov.usuario}</td>
                    <td>${mov.material}</td>
                    <td>${mov.quantidade}</td>
                    <td>${mov.finalidade}</td>
                    <td><span class="alert-${
                      mov.status === "Devolvido" ? "success" : "info"
                    }" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${
      mov.status
    }</span></td>
                `;
    tbody.appendChild(row);
  });
}

// Carregar histórico do usuário - versão melhorada
function loadHistoricoUsuario() {
  const tbody = document.getElementById("historico-tbody");
  tbody.innerHTML = "";

  const userName = document.getElementById("user-name").textContent;
  const userMovs = movimentacoes.filter((mov) => mov.usuario === userName);

  console.log("Carregando histórico para:", userName);
  console.log("Movimentações encontradas:", userMovs.length);

  if (userMovs.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; color: #666;">Nenhuma movimentação encontrada</td></tr>';
    return;
  }

  // Ordenar por data (mais recente primeiro)
  userMovs.sort((a, b) => new Date(b.data) - new Date(a.data));

  userMovs.forEach((mov) => {
    const row = document.createElement("tr");
    row.innerHTML = `
                    <td>${new Date(mov.data).toLocaleDateString("pt-BR")}</td>
                    <td>${mov.material}</td>
                    <td>${mov.quantidade}</td>
                    <td>${mov.finalidade}</td>
                    <td><span class="alert-${
                      mov.status === "Devolvido" ? "success" : "info"
                    }" style="padding: 4px 8px; border-radius: 4px; font-size: 12px;">${
      mov.status
    }</span></td>
                `;
    tbody.appendChild(row);
  });
}

// Cadastrar material (admin) - versão com persistência
document
  .getElementById("material-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const nome = document.getElementById("material-nome").value;
    const categoria = document.getElementById("material-categoria").value;
    const quantidade = parseInt(
      document.getElementById("material-quantidade").value
    );
    const unidade = document.getElementById("material-unidade").value;
    const descricao = document.getElementById("material-descricao").value;

    const novoMaterial = {
      id: Date.now(), // Usar timestamp para ID único
      nome,
      categoria,
      quantidade,
      unidade,
      descricao,
    };

    materiais.push(novoMaterial);
    saveDataToStorage(); // Salvar dados

    showAlert("cadastrar-alert", "Material cadastrado com sucesso!", "success");
    document.getElementById("material-form").reset();

    loadEstoque();
    loadMateriais(); // Atualizar lista de materiais para usuários
  });

// Registrar retirada - versão com persistência
document
  .getElementById("retirada-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const materialId = parseInt(
      document.getElementById("material-select").value
    );
    const quantidade = parseInt(
      document.getElementById("quantidade-retirada").value
    );
    const finalidade = document.getElementById("finalidade").value;
    const tempoUso = parseInt(document.getElementById("tempo-uso").value);
    const observacoes = document.getElementById("observacoes").value;

    const material = materiais.find((m) => m.id === materialId);

    if (!material) {
      showAlert("retirada-alert", "Material não encontrado.", "error");
      return;
    }

    if (quantidade > material.quantidade) {
      showAlert(
        "retirada-alert",
        "Quantidade solicitada maior que disponível em estoque.",
        "error"
      );
      return;
    }

    // Atualizar estoque
    material.quantidade -= quantidade;

    // Adicionar movimentação
    const novaMovimentacao = {
      id: Date.now(), // Usar timestamp para ID único
      data: new Date().toISOString().split("T")[0],
      usuario: document.getElementById("user-name").textContent,
      material: material.nome,
      quantidade,
      finalidade,
      status: "Em uso",
      observacoes: observacoes || "",
      tempoUso: tempoUso,
    };

    movimentacoes.push(novaMovimentacao);
    saveDataToStorage(); // Salvar dados

    console.log("Nova movimentação registrada:", novaMovimentacao);
    console.log("Total de movimentações:", movimentacoes.length);

    showAlert("retirada-alert", "Retirada registrada com sucesso!", "success");
    document.getElementById("retirada-form").reset();

    loadMateriais();
    loadHistoricoUsuario();

    // Se for admin, atualizar também as visualizações de admin
    if (userRole === "admin") {
      loadEstoque();
      loadMovimentacoes();
    }
  });

// Funções auxiliares
function showAlert(elementId, message, type) {
  const alertElement = document.getElementById(elementId);
  alertElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

function clearAlert(elementId) {
  document.getElementById(elementId).innerHTML = "";
}

function showLoading(elementId, show) {
  const loadingElement = document.getElementById(elementId);
  if (show) {
    loadingElement.style.display = "block";
  } else {
    loadingElement.style.display = "none";
  }
}

// Função de debug
function debugData() {
  console.log("=== DEBUG DE DADOS ===");
  console.log(
    "Usuário atual:",
    currentUser ? currentUser.getUsername() : "Nenhum"
  );
  console.log("Role do usuário:", userRole);
  console.log("Total de materiais:", materiais.length);
  console.log("Materiais:", materiais);
  console.log("Total de movimentações:", movimentacoes.length);
  console.log("Movimentações:", movimentacoes);
  console.log(
    "LocalStorage materiais:",
    localStorage.getItem("laboratorio_materiais")
  );
  console.log(
    "LocalStorage movimentações:",
    localStorage.getItem("laboratorio_movimentacoes")
  );

  alert(`Debug concluído! Verifique o console do navegador.
            
Resumo:
- Materiais: ${materiais.length}
- Movimentações: ${movimentacoes.length}
- Role: ${userRole}
- Usuário: ${currentUser ? currentUser.getUsername() : "Nenhum"}`);
}

// Inicialização - versão com carregamento de dados
window.addEventListener("load", function () {
  // Carregar dados salvos
  loadDataFromStorage();

  const hash = window.location.hash || "#login";

  if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
    navigate(hash);
  } else {
    checkAuth();
  }
});

window.addEventListener("hashchange", function () {
  const hash = window.location.hash;

  if (hash === "#login" || hash === "#cadastro" || hash === "#confirmacao") {
    navigate(hash);
  }
});

setTimeout(() => {
  loadMateriais();
}, 1000);
