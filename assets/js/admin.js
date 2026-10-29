// =========================================
// ADMIN - PAINEL DE CONTROLE (JavaScript)
// =========================================

(function () {
    'use strict';

    // Elementos do DOM
    const telaLogin = document.getElementById('tela-login');
    const telaPainel = document.getElementById('tela-painel');

    // Login
    const formLogin = document.getElementById('form-login');
    const loginUser = document.getElementById('login-user');
    const loginPass = document.getElementById('login-pass');
    const loginErro = document.getElementById('login-erro');

    // Upload
    const formUpload = document.getElementById('form-upload');
    const uploadJogo = document.getElementById('upload-jogo');
    const uploadTitulo = document.getElementById('upload-titulo');
    const uploadArquivo = document.getElementById('upload-arquivo');
    const uploadArea = document.getElementById('upload-area');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadProgresso = document.getElementById('upload-progresso');
    const barraPreenchimento = document.getElementById('barra-preenchimento');
    const progressoTexto = document.getElementById('progresso-texto');
    const uploadStatus = document.getElementById('upload-status');
    const btnUpload = document.getElementById('btn-upload');

    // Logout
    const btnLogout = document.getElementById('btn-logout');

    // =========================================
    // VERIFICAR SESSÃO AO CARREGAR
    // =========================================
    fetch('api/check_session.php')
        .then(r => r.json())
        .then(data => {
            if (data.loggedIn) {
                mostrarPainel();
            }
        })
        .catch(() => { });

    // =========================================
    // LOGIN
    // =========================================
    formLogin.addEventListener('submit', function (e) {
        e.preventDefault();
        loginErro.textContent = '';

        const username = loginUser.value.trim();
        const password = loginPass.value;

        if (!username || !password) {
            loginErro.textContent = 'Preencha todos os campos';
            return;
        }

        fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    mostrarPainel();
                } else {
                    loginErro.textContent = data.error || 'Erro ao fazer login';
                }
            })
            .catch(err => {
                console.error('Erro de login:', err);
                loginErro.textContent = 'Falha na conexão com o servidor';
            });
    });

    // =========================================
    // LOGOUT
    // =========================================
    btnLogout.addEventListener('click', function () {
        fetch('api/logout.php')
            .then(() => {
                telaLogin.style.display = 'flex';
                telaPainel.style.display = 'none';
                loginUser.value = '';
                loginPass.value = '';
            })
            .catch(err => console.error('Erro ao fazer logout:', err));
    });

    // =========================================
    // MOSTRAR PAINEL E CARREGAR JOGOS
    // =========================================
    function mostrarPainel() {
        telaLogin.style.display = 'none';
        telaPainel.style.display = 'block';
        carregarJogos();
    }

    function carregarJogos() {
        fetch('api/jogos.php')
            .then(r => r.json())
            .then(data => {
                if (!data.success) return;

                // Mantém a primeira opção padrão
                uploadJogo.innerHTML = '<option value="">Selecione o jogo...</option>';

                data.jogos.forEach(function (jogo) {
                    const option = document.createElement('option');
                    option.value = jogo.slug;
                    option.textContent = jogo.nome;
                    uploadJogo.appendChild(option);
                });
            })
            .catch(err => console.error('Erro ao carregar jogos:', err));
    }

    // =========================================
    // ÁREA DE UPLOAD - DRAG & DROP + CLICK
    // =========================================
    uploadArea.addEventListener('click', function () {
        uploadArquivo.click();
    });

    uploadArquivo.addEventListener('change', function () {
        if (this.files && this.files[0]) {
            mostrarPreview(this.files[0]);
        }
    });

    // Drag & Drop
    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', function () {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadArquivo.files = e.dataTransfer.files;
            mostrarPreview(e.dataTransfer.files[0]);
        }
    });

    function mostrarPreview(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            uploadPreview.src = e.target.result;
            uploadPreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // =========================================
    // ENVIO DO UPLOAD
    // =========================================
    formUpload.addEventListener('submit', function (e) {
        e.preventDefault();

        const jogo = uploadJogo.value;
        const titulo = uploadTitulo.value.trim();
        const arquivo = uploadArquivo.files[0];

        // Validação
        if (!jogo) {
            setStatus('Selecione uma dimensão', 'erro');
            return;
        }
        if (!arquivo) {
            setStatus('Selecione uma imagem', 'erro');
            return;
        }

        // Prepara FormData
        const formData = new FormData();
        formData.append('jogo', jogo);
        formData.append('titulo', titulo);
        formData.append('imagem', arquivo);

        // XMLHttpRequest para acompanhar progresso
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', function (e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                barraPreenchimento.style.width = percent + '%';
                progressoTexto.textContent = percent + '%';
            }
        });

        xhr.addEventListener('load', function () {
            try {
                const data = JSON.parse(xhr.responseText);
                if (data.success) {
                    setStatus('Registro enviado com sucesso!', 'sucesso');
                    resetUploadForm();
                } else {
                    setStatus(data.error || 'Erro ao enviar', 'erro');
                }
            } catch (err) {
                setStatus('Erro na resposta do servidor', 'erro');
            }

            uploadProgresso.style.display = 'none';
            btnUpload.disabled = false;
        });

        xhr.addEventListener('error', function () {
            setStatus('Falha na conexão com o servidor', 'erro');
            uploadProgresso.style.display = 'none';
            btnUpload.disabled = false;
        });

        // Inicia envio
        btnUpload.disabled = true;
        uploadProgresso.style.display = 'block';
        barraPreenchimento.style.width = '0%';
        progressoTexto.textContent = '0%';
        setStatus('', '');

        xhr.open('POST', 'api/upload.php', true);
        xhr.send(formData);
    });

    function resetUploadForm() {
        uploadArquivo.value = '';
        uploadTitulo.value = '';
        uploadPreview.style.display = 'none';
        uploadPlaceholder.style.display = 'block';
        barraPreenchimento.style.width = '0%';
    }

    function setStatus(msg, tipo) {
        uploadStatus.textContent = msg;
        uploadStatus.className = 'upload-status' + (tipo ? ' ' + tipo : '');
    }

})();
