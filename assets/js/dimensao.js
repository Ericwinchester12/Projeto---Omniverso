// =========================================
// DIMENSÃO - GALERIA DE PRINTS (JavaScript)
// =========================================

(function () {
    'use strict';

    // Pega o parâmetro ?jogo= da URL
    const params = new URLSearchParams(window.location.search);
    const jogoSlug = params.get('jogo');

    const tituloEl = document.getElementById('titulo-jogo');
    const subtituloEl = document.getElementById('subtitulo-jogo');
    const galeriaContainer = document.getElementById('galeria-container');
    const galeriaVazia = document.getElementById('galeria-vazia');

    // Lightbox
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTitulo = document.getElementById('lightbox-titulo');
    const lightboxFechar = document.getElementById('lightbox-fechar');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    let imagensData = [];
    let lightboxIndex = 0;
    let isAdmin = false;

    // Elementos adicionais
    const btnAddPrint = document.getElementById('btn-add-print');
    const tabAtiva = document.getElementById('tab-' + jogoSlug);
    if (tabAtiva) {
        tabAtiva.classList.add('ativo');
    }

    // =========================================
    // INICIALIZAÇÃO
    // =========================================
    if (!jogoSlug) {
        tituloEl.textContent = 'DIMENSÃO NÃO ENCONTRADA';
        subtituloEl.textContent = 'Nenhuma dimensão foi especificada';
        return;
    }

    // Inicialização sequencial (evita race condition no isAdmin)
    iniciar();

    async function iniciar() {
        await checkAdmin();
        await carregarImagens();
    }

    // =========================================
    // FUNÇÕES
    // =========================================

    async function checkAdmin() {
        try {
            const r = await fetch('api/check_session.php');
            const data = await r.json();
            isAdmin = data.loggedIn === true;

            if (isAdmin && btnAddPrint) {
                btnAddPrint.style.display = 'inline-block';
                btnAddPrint.href = 'admin.html?jogo=' + encodeURIComponent(jogoSlug);
            }
        } catch {
            isAdmin = false;
        }
    }

    function carregarImagens() {
        fetch('api/imagens.php?jogo=' + encodeURIComponent(jogoSlug))
            .then(r => r.json())
            .then(data => {
                if (!data.success) {
                    tituloEl.textContent = 'DIMENSÃO NÃO ENCONTRADA';
                    subtituloEl.textContent = data.error || 'Erro desconhecido';
                    return;
                }

                tituloEl.textContent = data.jogo.nome.toUpperCase();
                subtituloEl.textContent = 'Registros do multiverso — ' + data.total + ' arquivo' + (data.total !== 1 ? 's' : '');
                document.title = 'O Omniverso | ' + data.jogo.nome;

                imagensData = data.imagens;

                if (imagensData.length === 0) {
                    galeriaVazia.style.display = 'block';
                    return;
                }

                renderizarGaleria();
            })
            .catch(err => {
                console.error('Erro ao carregar imagens:', err);
                tituloEl.textContent = 'ERRO';
                subtituloEl.textContent = 'Falha ao acessar os arquivos desta dimensão';
            });
    }

    function renderizarGaleria() {
        // Limpa items antigos (mantém o galeriaVazia)
        const items = galeriaContainer.querySelectorAll('.galeria-item');
        items.forEach(item => item.remove());

        imagensData.forEach(function (img, index) {
            const item = document.createElement('div');
            item.className = 'galeria-item';
            item.setAttribute('data-index', index);

            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.alt = img.titulo || 'Print';
            imgEl.loading = 'lazy';

            const overlay = document.createElement('div');
            overlay.className = 'overlay';

            if (img.titulo) {
                const tituloSpan = document.createElement('span');
                tituloSpan.className = 'img-titulo';
                tituloSpan.textContent = img.titulo;
                overlay.appendChild(tituloSpan);
            }

            item.appendChild(imgEl);
            item.appendChild(overlay);

            // Botão de excluir (visível somente se for admin)
            if (isAdmin) {
                const btnExcluir = document.createElement('button');
                btnExcluir.className = 'btn-excluir';
                btnExcluir.innerHTML = '&times;';
                btnExcluir.title = 'Excluir imagem';
                btnExcluir.addEventListener('click', function (e) {
                    e.stopPropagation();
                    excluirImagem(img.id, item);
                });
                item.appendChild(btnExcluir);
            }

            // Abre o lightbox ao clicar
            item.addEventListener('click', function () {
                abrirLightbox(index);
            });

            galeriaContainer.appendChild(item);
        });
    }

    function excluirImagem(id, itemEl) {
        if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

        fetch('api/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    itemEl.remove();
                    imagensData = imagensData.filter(img => img.id !== id);
                    subtituloEl.textContent = 'Registros do multiverso — ' + imagensData.length + ' arquivo' + (imagensData.length !== 1 ? 's' : '');

                    if (imagensData.length === 0) {
                        galeriaVazia.style.display = 'block';
                    }
                } else {
                    alert('Erro ao excluir: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(err => {
                console.error('Erro ao excluir:', err);
                alert('Falha na conexão');
            });
    }

    // =========================================
    // LIGHTBOX
    // =========================================

    function abrirLightbox(index) {
        lightboxIndex = index;
        atualizarLightbox();
        lightbox.classList.add('ativo');
        document.body.style.overflow = 'hidden';
    }

    function fecharLightbox() {
        lightbox.classList.remove('ativo');
        document.body.style.overflow = '';
    }

    function atualizarLightbox() {
        const img = imagensData[lightboxIndex];
        if (!img) return;
        lightboxImg.src = img.url;
        lightboxImg.alt = img.titulo || 'Print';
        lightboxTitulo.textContent = img.titulo || '';
    }

    function navAnterior() {
        lightboxIndex = (lightboxIndex - 1 + imagensData.length) % imagensData.length;
        atualizarLightbox();
    }

    function navProximo() {
        lightboxIndex = (lightboxIndex + 1) % imagensData.length;
        atualizarLightbox();
    }

    // Eventos do Lightbox
    lightboxFechar.addEventListener('click', fecharLightbox);
    lightboxPrev.addEventListener('click', navAnterior);
    lightboxNext.addEventListener('click', navProximo);

    // Fecha ao clicar fora da imagem
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
            fecharLightbox();
        }
    });

    // Navegação por teclado
    document.addEventListener('keydown', function (e) {
        if (!lightbox.classList.contains('ativo')) return;

        if (e.key === 'Escape') fecharLightbox();
        if (e.key === 'ArrowLeft') navAnterior();
        if (e.key === 'ArrowRight') navProximo();
    });

})();
