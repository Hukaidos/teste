// Importar os módulos do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDRXFMkxAiYPNM0CL2QUsiELwa2fjku-sk",
  authDomain: "expedicao-atacadao.firebaseapp.com",
  databaseURL: "https://expedicao-atacadao-default-rtdb.firebaseio.com",
  projectId: "expedicao-atacadao",
  storageBucket: "expedicao-atacadao.firebasestorage.app",
  messagingSenderId: "1012289682816",
  appId: "1:1012289682816:web:f0ab186e941ce48ec3d565",
  measurementId: "G-J16CQ6H6CS"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Espera o DOM ser completamente carregado
document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status");
  const form = document.getElementById("motoristaForm");
  const motoristasLista = document.getElementById("motoristasLista");
  const gravarBtn = document.getElementById("gravarBtn");
  const pesquisaForm = document.getElementById("pesquisaForm");
  const pesquisaCargaInput = document.getElementById("pesquisaCarga");

  // Variáveis para o estado de edição
  let editId = null;

  // Função para mostrar motoristas salvos
  async function mostrarMotoristas(queryFilter = null) {
    try {
      let motoristasSnapshot;
      if (queryFilter) {
        motoristasSnapshot = await getDocs(queryFilter);
      } else {
        motoristasSnapshot = await getDocs(collection(db, "motoristas"));
      }
      motoristasLista.innerHTML = ''; // Limpar a lista antes de adicionar novos motoristas

      if (motoristasSnapshot.empty) {
        statusDiv.textContent = "Nenhum motorista encontrado.";
        statusDiv.classList.remove("success");
        statusDiv.classList.add("error");
      } else {
        motoristasSnapshot.forEach(docSnapshot => {
          const motorista = docSnapshot.data();
          const motoristaId = docSnapshot.id;

          const motoristaDiv = document.createElement("div");
          motoristaDiv.classList.add("motorista-item");

          motoristaDiv.innerHTML =
            `<p><strong>Nome:</strong> ${motorista.nome} - <strong>Carga:</strong> ${motorista.carga}</p>
            <p><button class="edit-btn" data-id="${motoristaId}">Editar</button> 
            <button class="delete-btn" data-id="${motoristaId}">Excluir</button></p>`
            

          // Evento de edição
          const editButton = motoristaDiv.querySelector(".edit-btn");
          editButton.addEventListener("click", async (e) => {
            const idMotorista = e.target.getAttribute("data-id");
            try {
              // Usando getDoc para buscar um único documento
              const motoristaRef = doc(db, "motoristas", idMotorista);
              const motoristaDoc = await getDoc(motoristaRef);

              if (motoristaDoc.exists()) {
                const motoristaData = motoristaDoc.data();
                document.getElementById("nome").value = motoristaData.nome;
                document.getElementById("carga").value = motoristaData.carga;
                editId = idMotorista; // Define o ID para edição
                gravarBtn.textContent = "Atualizar"; // Mudar o texto do botão para "Atualizar"
              } else {
                console.error("Motorista não encontrado.");
                statusDiv.textContent = "Motorista não encontrado.";
                statusDiv.classList.remove("success");
                statusDiv.classList.add("error");
              }
            } catch (error) {
              console.error("Erro ao carregar dados para edição:", error.message);
              if (statusDiv) {
                statusDiv.textContent = `Erro ao carregar dados para edição: ${error.message}`;
                statusDiv.classList.remove("success");
                statusDiv.classList.add("error");
              }
            }
          });

          // Evento de exclusão
          const deleteButton = motoristaDiv.querySelector(".delete-btn");
          deleteButton.addEventListener("click", async (e) => {
            const idMotorista = e.target.getAttribute("data-id");
            try {
              // Excluir o motorista do Firestore
              const motoristaRef = doc(db, "motoristas", idMotorista);
              await deleteDoc(motoristaRef);
              if (statusDiv) {
                statusDiv.textContent = "Motorista excluído com sucesso!";
                statusDiv.classList.remove("error");
                statusDiv.classList.add("success");
              }
              mostrarMotoristas(); // Atualizar a lista de motoristas
            } catch (error) {
              if (statusDiv) {
                statusDiv.textContent = `Erro ao excluir motorista: ${error.message}`;
                statusDiv.classList.remove("success");
                statusDiv.classList.add("error");
              }
            }
          });

          motoristasLista.appendChild(motoristaDiv);
        });
      }
    } catch (error) {
      if (statusDiv) {
        console.error("Erro ao carregar motoristas:", error.message);
        statusDiv.textContent = `Erro ao carregar motoristas: ${error.message}`;
        statusDiv.classList.remove("success");
        statusDiv.classList.add("error");
      }
    }
  }

  // Event Listener para o formulário de cadastro
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const carga = document.getElementById("carga").value.trim();

    try {
      if (editId) {
        // Se estamos editando, atualiza o motorista no Firestore
        const motoristaRef = doc(db, "motoristas", editId);
        await updateDoc(motoristaRef, { nome, carga });

        if (statusDiv) {
          statusDiv.textContent = "Motorista atualizado com sucesso!";
          statusDiv.classList.remove("error");
          statusDiv.classList.add("success");
        }
        form.reset();
        gravarBtn.textContent = "Gravar"; // Voltar para "Gravar"
        editId = null; // Limpa o ID de edição
      } else {
        // Caso contrário, adiciona um novo motorista
        await addDoc(collection(db, "motoristas"), { nome, carga });

        if (statusDiv) {
          statusDiv.textContent = "Motorista cadastrado com sucesso!";
          statusDiv.classList.remove("error");
          statusDiv.classList.add("success");
        }
        form.reset();
      }

      // Exibe os motoristas após cadastro ou edição
      mostrarMotoristas();
    } catch (error) {
      if (statusDiv) {
        console.error("Erro ao salvar motorista:", error.message);
        statusDiv.textContent = `Erro ao salvar motorista: ${error.message}`;
        statusDiv.classList.remove("success");
        statusDiv.classList.add("error");
      }
    }
  });

  // Event Listener para o formulário de pesquisa
  pesquisaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cargaPesquisada = pesquisaCargaInput.value.trim();

    if (cargaPesquisada) {
      const cargaQuery = query(collection(db, "motoristas"), where("carga", "==", cargaPesquisada));
      await mostrarMotoristas(cargaQuery); // Passa o filtro de pesquisa para a função
    } else {
      statusDiv.textContent = "Por favor, insira uma carga para pesquisar.";
      statusDiv.classList.remove("success");
      statusDiv.classList.add("error");
      mostrarMotoristas(); // Exibe todos os motoristas caso a carga esteja vazia
    }
  });

  // Função para garantir que o DOM foi completamente carregado
  mostrarMotoristas();
});
