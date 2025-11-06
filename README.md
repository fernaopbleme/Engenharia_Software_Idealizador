# Engenharia_Software_Idealizador

Este repositório será utilizado para ter um controle de versionamento do projeto de engenharia de software, mais especificamente a parte do idealizador.

## Estrutura do Projeto

```
Engenharia_Software_Idealizador/
├── backend/                    # Backend (API Mock)
│   └── mock_colaboradores/
│       ├── main.py            # API FastAPI
│       └── requirements.txt
│
├── frontend/                   # Frontend
│   ├── html/                  # Páginas HTML
│   │   ├── home.html
│   │   ├── pagina_projeto.html
│   │   └── criar_projeto.html
│   ├── css/                   # Estilos CSS
│   │   ├── home.css
│   │   ├── pagina_projeto.css
│   │   └── criar_projeto.css
│   └── js/                    # Scripts JavaScript
│       ├── home/
│       │   └── home.js
│       ├── pagina_projeto/
│       │   └── pagina_projeto.js
│       └── criar_projeto/
│           ├── criar_projeto.js
│           ├── api.js
│           ├── ui.js
│           ├── tags.service.js
│           └── projects.service.js
```

## Como executar

### Backend (API Mock)

```bash
cd backend/mock_colaboradores
python3 main.py
```

A API estará disponível em: http://localhost:8000

**Documentação da API (Swagger):** http://localhost:8000/docs

### Frontend

Para servir os arquivos HTML, você pode usar um servidor HTTP simples:

```bash
cd frontend
python3 -m http.server 8080
```

Ou usando Node.js (http-server):

```bash
cd frontend
npx http-server -p 8080
```

**Acesse:** http://localhost:8080/html/home.html

## Links Úteis

- 🏠 Home: http://localhost:8080/html/home.html
- 📝 Criar Projeto: http://localhost:8080/html/criar_projeto.html
- 📄 Ver Projeto: http://localhost:8080/html/pagina_projeto.html?id=1
- 🔧 API Docs: http://localhost:8000/docs
