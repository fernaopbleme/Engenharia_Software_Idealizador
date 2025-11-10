 const btnLogin = document.getElementById("login-btn");
        const mensagem = document.getElementById("mensagem");

        btnLogin.addEventListener("click", async () => {
            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;

            try {
                const resposta = await fetch("https://loginidealizador.azurewebsites.net/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, password: senha })
                });

                if (resposta.ok) {
                    const data = await resposta.json();
                    // Opcional: salvar o token para uso futuro
                    localStorage.setItem("access_token", data.access_token);
                    // Redirecionar para a página principal
                    window.location.href = "../home/home.html";
                } else {
                    const erro = await resposta.json();
                    mensagem.textContent = "❌ Erro: " + erro.detail;
                    mensagem.style.color = "red";
                }
            } catch (e) {
                mensagem.textContent = "⚠️ Erro de conexão com o servidor.";
                mensagem.style.color = "orange";
            }
        });