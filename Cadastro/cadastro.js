        // Validação de senha
        document.getElementById('confirmar-senha').addEventListener('input', function() {
            const senha = document.getElementById('senha').value;
            const confirmarSenha = this.value;
            
            if (senha !== confirmarSenha) {
                this.setCustomValidity('As senhas não coincidem');
            } else {
                this.setCustomValidity('');
            }
        });

        // Validação de email
        document.getElementById('email').addEventListener('input', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.setCustomValidity('Digite um email válido');
            } else {
                this.setCustomValidity('');
            }
        });

        // Formatação de telefone
        document.getElementById('telefone').addEventListener('input', function() {
            let value = this.value.replace(/\D/g, '');
            if (value.length >= 11) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length >= 7) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            this.value = value;
        });

        // Submissão do formulário
        document.querySelector('.cadastro').addEventListener('submit', function(e) {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const sobrenome = document.getElementById('sobrenome').value;
            // nome e sobrenome agora são enviados separados
            const cpf = document.getElementById("cpf").value;
            const email = document.getElementById('email').value;
            const senha = document.getElementById('senha').value;
            const nomeUsuario = document.getElementById("nomeUsuario").value;
            const confirmarSenha = document.getElementById('confirmar-senha').value;
            const telefone = document.getElementById('telefone').value;
            const termos = document.querySelector('input[name="termos"]').checked;

            if (senha !== confirmarSenha) {
                alert('As senhas não coincidem!');
                return;
            }

            if (!termos) {
                alert('Você deve aceitar os termos de uso!');
                return;
            }

            // Validação extra dos campos obrigatórios
            if (!email || !senha || !nome || !sobrenome || !cpf || !nomeUsuario || !telefone) {
                alert('Preencha todos os campos obrigatórios!');
                return;
            }

            fetch('https://loginidealizador.azurewebsites.net/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: senha,
                    nome: nome,
                    sobrenome: sobrenome,
                    CPF: cpf,
                    nomeUsuario: nomeUsuario,
                    telefone: telefone
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao criar conta');
                return response.json();
            })
            .then(data => {
                alert('Conta criada com sucesso! Redirecionando para o login...');
                window.location.href = '../login/login.html';
            })
            .catch(error => {
                alert('Erro: ' + error.message);
            });
        });