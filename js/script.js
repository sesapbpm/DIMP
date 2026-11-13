/**
 * Portal Institucional Projeto BPM SESAP/RN - Script Principal
 * Gestão por Processos e Repositório Centralizado
 */

(function () {
    'use strict';

    // Estado da Aplicação
    const state = {
        data: null,
        currentFront: 'Todas',
        searchQuery: '',
        filterUnidade: 'Todas',
        filterNivel: 'Todos',
        filterFluxo: 'Todos',
        filterStatus: 'Todos',
        filterSistema: 'Todos',
        sortBy: 'codigo',
        currentView: 'cards', // 'cards' ou 'table'
        
        // Filtros de POPs e Manuais (Seção Gestão por Processos)
        popsSearch: '',
        popsFront: 'Todas',
        popsType: 'Todos',

        selectedProcess: null
    };

    // Inicialização ao carregar o DOM
    document.addEventListener('DOMContentLoaded', () => {
        initData();
        setupNavigation();
        setupHeroFrontCards();
        setupRepoFilters();
        setupModal();
        setupBpmSectionTabs();
        setupPopsFilters();
        setupStreamlitControls();
        setupExMembersAccordion();
        setupReportsFilter();
    });

    /**
     * Carrega a base de dados do portal
     */
    function initData() {
        if (window.DIMP_DATA) {
            state.data = window.DIMP_DATA;
            renderPortal();
        } else {
            // Fallback para carregamento assíncrono via fetch
            Promise.all([
                fetch('dados/processos.json').then(r => r.json()),
                fetch('dados/modelos.json').then(r => r.json()),
                fetch('dados/pops_manuais.json').then(r => r.json()),
                fetch('dados/documentos.json').then(r => r.json()),
                fetch('dados/capacitacoes.json').then(r => r.json())
            ]).then(([processos, modelos, pops_manuais, documentos, capacitacoes]) => {
                state.data = { processos, modelos, pops_manuais, documentos, capacitacoes };
                renderPortal();
            }).catch(err => {
                console.error('Erro ao carregar bases de dados:', err);
                const countEl = document.getElementById('results-count');
                if (countEl) countEl.textContent = 'Erro ao carregar repositório de processos.';
            });
        }
    }

    /**
     * Renderiza todos os módulos orientados a dados
     */
    function renderPortal() {
        if (!state.data) return;
        updateKpiCounters();
        renderRepository();
        renderBpmSection();
        renderReports();
    }

    /**
     * Atualiza os contadores gerais do projeto no Hero
     */
    function updateKpiCounters() {
        const totalProc = state.data.processos ? state.data.processos.length : 31;
        const totalPops = state.data.pops_manuais ? state.data.pops_manuais.length : 10;
        const totalDocs = state.data.documentos ? state.data.documentos.length : 3;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('kpi-total-processos', totalProc);
        setVal('kpi-total-frentes', 6);
        setVal('kpi-pops-disponiveis', totalPops);
        setVal('kpi-relatorios-disponiveis', totalDocs);
    }

    /**
     * Menu móvel e scroll do header
     */
    function setupNavigation() {
        const toggle = document.getElementById('mobile-toggle');
        const nav = document.getElementById('main-nav');
        const header = document.getElementById('header');

        if (toggle && nav) {
            toggle.addEventListener('click', () => {
                const isOpen = nav.classList.toggle('open');
                toggle.setAttribute('aria-expanded', isOpen);
                toggle.classList.toggle('active', isOpen);
            });

            nav.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('open');
                    toggle.classList.remove('active');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });
        }

        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    /**
     * Ação dos cards das 5 frentes no hero
     */
    function setupHeroFrontCards() {
        document.querySelectorAll('.front-card').forEach(card => {
            card.addEventListener('click', () => {
                const front = card.getAttribute('data-front');
                if (front) {
                    selectFrontTab(front);
                }
            });
        });
    }

    /**
     * Seleciona uma aba de frente de trabalho no repositório
     */
    function selectFrontTab(frontName) {
        state.currentFront = frontName;
        document.querySelectorAll('.front-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-front') === frontName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        renderRepository();
    }

    /**
     * Filtros e ordenação do repositório
     */
    function setupRepoFilters() {
        // Abas de frente
        document.querySelectorAll('.front-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.front-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.currentFront = btn.getAttribute('data-front');
                renderRepository();
            });
        });

        // Campo de busca
        const searchInput = document.getElementById('repo-search');
        const clearBtn = document.getElementById('clear-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim().toLowerCase();
                if (clearBtn) clearBtn.style.display = state.searchQuery ? 'block' : 'none';
                renderRepository();
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                state.searchQuery = '';
                clearBtn.style.display = 'none';
                renderRepository();
            });
        }

        // Selects
        const bindSelect = (id, stateKey) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    state[stateKey] = e.target.value;
                    renderRepository();
                });
            }
        };

        bindSelect('filter-unidade', 'filterUnidade');
        bindSelect('filter-nivel', 'filterNivel');
        bindSelect('filter-fluxo', 'filterFluxo');
        bindSelect('filter-status', 'filterStatus');
        bindSelect('filter-sistema', 'filterSistema');
        bindSelect('repo-sort', 'sortBy');

        // Alternância Cards / Tabela
        const btnCards = document.getElementById('view-cards-btn');
        const btnTable = document.getElementById('view-table-btn');
        const gridView = document.getElementById('repo-grid');
        const tableView = document.getElementById('repo-table-container');

        if (btnCards && btnTable && gridView && tableView) {
            btnCards.addEventListener('click', () => {
                btnCards.classList.add('active');
                btnTable.classList.remove('active');
                gridView.classList.remove('hidden');
                tableView.classList.add('hidden');
                state.currentView = 'cards';
            });

            btnTable.addEventListener('click', () => {
                btnTable.classList.add('active');
                btnCards.classList.remove('active');
                gridView.classList.add('hidden');
                tableView.classList.remove('hidden');
                state.currentView = 'table';
            });
        }
    }

    /**
     * Aplica filtros e retorna a lista de processos filtrados
     */
    function getFilteredProcesses() {
        if (!state.data || !state.data.processos) return [];

        return state.data.processos.filter(p => {
            // Filtro por Frente de Trabalho
            if (state.currentFront !== 'Todas') {
                const frentes = [p.frente, ...(p.frentes_relacionadas || [])];
                if (!frentes.includes(state.currentFront)) return false;
            }

            // Filtro por Unidade Administrativa
            if (state.filterUnidade !== 'Todas') {
                if (!p.unidade.toLowerCase().includes(state.filterUnidade.toLowerCase())) return false;
            }

            // Filtro por Nível
            if (state.filterNivel !== 'Todos') {
                if (p.nivel !== state.filterNivel) return false;
            }

            // Filtro por Tipo de Fluxo
            if (state.filterFluxo !== 'Todos') {
                if (state.filterFluxo === 'com_as_is' && !p.has_as_is) return false;
                if (state.filterFluxo === 'com_to_be' && !p.has_to_be) return false;
                if (state.filterFluxo === 'ambos' && (!p.has_as_is || !p.has_to_be)) return false;
            }

            // Filtro por Situação/Status
            if (state.filterStatus !== 'Todos') {
                if (p.status !== state.filterStatus) return false;
            }

            // Filtro por Sistema
            if (state.filterSistema !== 'Todos') {
                if (!p.sistema.toLowerCase().includes(state.filterSistema.toLowerCase())) return false;
            }

            // Busca por texto
            if (state.searchQuery) {
                const q = state.searchQuery;
                const matchCode = p.codigo.toLowerCase().includes(q);
                const matchName = p.nome.toLowerCase().includes(q);
                const matchDesc = p.descricao.toLowerCase().includes(q);
                const matchUnit = p.unidade.toLowerCase().includes(q);
                const matchSys = p.sistema.toLowerCase().includes(q);
                if (!matchCode && !matchName && !matchDesc && !matchUnit && !matchSys) return false;
            }

            return true;
        }).sort((a, b) => {
            if (state.sortBy === 'codigo') {
                return a.codigo.localeCompare(b.codigo);
            } else if (state.sortBy === 'nome') {
                return a.nome.localeCompare(b.nome);
            } else if (state.sortBy === 'recente') {
                return (b.ultima_atualizacao || '').localeCompare(a.ultima_atualizacao || '');
            }
            return 0;
        });
    }

    /**
     * Renderiza o Repositório de Processos (Cards e Tabela)
     */
    function renderRepository() {
        const list = getFilteredProcesses();
        const countEl = document.getElementById('results-count');
        const gridEl = document.getElementById('repo-grid');
        const tableBody = document.getElementById('repo-table-body');

        if (countEl) {
            countEl.innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? 'processo encontrado' : 'processos encontrados'}`;
        }

        if (list.length === 0) {
            if (gridEl) {
                gridEl.innerHTML = `
                    <div class="no-results-box">
                        <i class="fa-solid fa-folder-open"></i>
                        <h3>Nenhum processo encontrado</h3>
                        <p>Tente ajustar os filtros ou pesquisar com outro termo.</p>
                        <button class="btn btn-sm btn-outline" id="reset-filters-btn">Redefinir Filtros</button>
                    </div>
                `;
                const resetBtn = document.getElementById('reset-filters-btn');
                if (resetBtn) resetBtn.addEventListener('click', resetAllFilters);
            }
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4">Nenhum processo encontrado com os filtros atuais.</td></tr>`;
            return;
        }

        // Renderiza Cards
        if (gridEl) {
            gridEl.innerHTML = list.map(p => `
                <div class="process-card" data-code="${p.codigo}">
                    <div class="process-card-header">
                        <div class="card-badges-row">
                            <span class="process-code-badge">${p.codigo}</span>
                            <span class="process-front-tag front-${p.frente.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${p.frente}</span>
                        </div>
                        <span class="status-pill status-${p.status.toLowerCase().replace(/\s+/g, '-')}">${p.status}</span>
                    </div>

                    <h3 class="process-card-title">${p.nome}</h3>
                    
                    <div class="process-card-meta">
                        <div class="meta-item"><i class="fa-solid fa-building-user"></i> <span>${p.unidade}</span></div>
                        <div class="meta-item"><i class="fa-solid fa-layer-group"></i> <span>Nível ${p.nivel} · Versão ${p.versao}</span></div>
                    </div>

                    <p class="process-card-desc">${p.descricao}</p>

                    <div class="flow-availability-row">
                        <span class="flow-pill available">
                            <i class="fa-solid fa-diagram-project"></i> Processo Mapeado
                        </span>
                        <span class="flow-pill ${p.has_pop ? 'available' : 'unavailable'}">
                            <i class="fa-solid ${p.has_pop ? 'fa-book' : 'fa-pen'}"></i> Base de Conhecimento
                        </span>
                    </div>

                    <div class="process-card-footer">
                        <button class="btn btn-sm btn-primary view-process-btn" data-code="${p.codigo}">
                            <i class="fa-solid fa-eye"></i> Visualizar Processo
                        </button>
                    </div>
                </div>
            `).join('');

            gridEl.querySelectorAll('.view-process-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.getAttribute('data-code');
                    openProcessModal(code);
                });
            });
        }

        // Renderiza Tabela
        if (tableBody) {
            tableBody.innerHTML = list.map(p => `
                <tr>
                    <td><strong class="text-primary">${p.codigo}</strong></td>
                    <td><strong>${p.nome}</strong></td>
                    <td><span class="table-front-tag">${p.frente}</span></td>
                    <td class="text-muted">${p.unidade}</td>
                    <td>${p.nivel}</td>
                    <td>
                        <div class="table-flows">
                            <span class="badge-mini badge-blue"><i class="fa-solid fa-diagram-project"></i> Processo Mapeado</span>
                        </div>
                    </td>
                    <td><span class="status-pill-sm status-${p.status.toLowerCase().replace(/\s+/g, '-')}">${p.status}</span></td>
                    <td>v${p.versao}</td>
                    <td>
                        <button class="btn btn-xs btn-primary table-view-btn" data-code="${p.codigo}" title="Visualizar Detalhes">
                            <i class="fa-solid fa-eye"></i> Visualizar
                        </button>
                    </td>
                </tr>
            `).join('');

            tableBody.querySelectorAll('.table-view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const code = btn.getAttribute('data-code');
                    openProcessModal(code);
                });
            });
        }
    }

    /**
     * Reseta todos os filtros
     */
    function resetAllFilters() {
        state.currentFront = 'Todas';
        state.searchQuery = '';
        state.filterUnidade = 'Todas';
        state.filterNivel = 'Todos';
        state.filterFluxo = 'Todos';
        state.filterStatus = 'Todos';
        state.filterSistema = 'Todos';
        state.sortBy = 'codigo';

        const searchInput = document.getElementById('repo-search');
        if (searchInput) searchInput.value = '';
        const clearBtn = document.getElementById('clear-search');
        if (clearBtn) clearBtn.style.display = 'none';

        const resetSelect = (id) => {
            const el = document.getElementById(id);
            if (el) el.selectedIndex = 0;
        };
        resetSelect('filter-unidade');
        resetSelect('filter-nivel');
        resetSelect('filter-fluxo');
        resetSelect('filter-status');
        resetSelect('filter-sistema');
        resetSelect('repo-sort');

        document.querySelectorAll('.front-tab-btn').forEach((b, i) => {
            b.classList.toggle('active', i === 0);
        });

        renderRepository();
    }

    /**
     * Modal Individual do Processo (Estrutura Simplificada em 5 Blocos)
     */
    function setupModal() {
        const backdrop = document.getElementById('process-modal-backdrop');
        const closeBtn = document.getElementById('modal-close-btn');
        const footerCloseBtn = document.getElementById('modal-footer-close');

        const closeModal = () => {
            if (backdrop) backdrop.classList.add('hidden');
            document.body.style.overflow = '';
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (footerCloseBtn) footerCloseBtn.addEventListener('click', closeModal);

        if (backdrop) {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) closeModal();
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && backdrop && !backdrop.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    /**
     * Abre e popula a página individual simplificada de cada processo
     */
    function openProcessModal(processCode) {
        if (!state.data) return;
        const process = state.data.processos.find(p => p.codigo === processCode);
        if (!process) return;

        state.selectedProcess = process;
        const backdrop = document.getElementById('process-modal-backdrop');

        // 1. Identificação do Processo
        document.getElementById('modal-process-code').textContent = process.codigo;
        document.getElementById('modal-process-front').textContent = process.frente;
        document.getElementById('modal-process-status').textContent = process.status;
        document.getElementById('modal-process-status').className = `status-pill status-${process.status.toLowerCase().replace(/\s+/g, '-')}`;
        document.getElementById('modal-process-name').textContent = process.nome;
        document.getElementById('modal-process-unit').innerHTML = `<i class="fa-solid fa-building-user"></i> <strong>Unidade:</strong> ${process.unidade || 'Secretaria de Estado da Saúde Pública'}`;

        // 2. Descrição e Escopo do Processo
        document.getElementById('modal-process-desc').textContent = process.descricao;
        const escopoEl = document.getElementById('modal-process-escopo');
        if (escopoEl) {
            escopoEl.innerHTML = process.escopo ? `<strong>Escopo e Limites:</strong> ${process.escopo}` : '';
        }

        // 3. Objetivo Institucional
        document.getElementById('modal-process-objective').textContent = process.objetivo || 'Contribuir para a modernização das rotinas administrativas e assistenciais da SESAP/RN por meio da padronização e melhoria contínua.';

        // 4. Acesso aos Documentos (Caixa 1: Fluxograma | Caixa 2: Base de Conhecimento)
        // Caixa 1 — Fluxograma do Processo (Somente UM link de "Acessar Fluxograma")
        const flowButtonsContainer = document.getElementById('modal-flow-buttons');
        if (flowButtonsContainer) {
            const flowUrl = process.link_fluxograma_as_is || process.link_fluxograma_to_be || process.link_interativo;
            if (flowUrl && flowUrl !== '#') {
                flowButtonsContainer.innerHTML = `
                    <a href="${flowUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                        <i class="fa-solid fa-diagram-project"></i> Acessar Fluxograma
                    </a>
                `;
            } else {
                flowButtonsContainer.innerHTML = `
                    <span class="btn btn-sm btn-outline disabled" style="opacity: 0.7; cursor: default;">
                        <i class="fa-solid fa-hourglass-half"></i> Fluxograma em Elaboração
                    </span>
                `;
            }
        }

        // Caixa 2 — Base de Conhecimento
        const docButtonsContainer = document.getElementById('modal-doc-buttons');
        if (docButtonsContainer) {
            const docLink = process.link_base_conhecimento || 'reports/Relatório Parcial Projeto DIMP SESAP  etapa 2.pdf';
            docButtonsContainer.innerHTML = `
                <a href="${docLink}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                    <i class="fa-solid fa-file-pdf"></i> Acessar Documento Completo
                </a>
            `;
        }

        // 5. Base Normativa e Legal
        document.getElementById('modal-process-norma').innerHTML = process.base_normativa 
            ? `<i class="fa-solid fa-scale-balanced"></i> ${process.base_normativa}` 
            : 'Legislação estadual e federal aplicável à administração pública e saúde pública.';

        // 6. Situação de Validação e Versão
        const statusFooterPill = document.getElementById('modal-status-footer-pill');
        if (statusFooterPill) {
            statusFooterPill.textContent = process.status;
            statusFooterPill.className = `status-pill status-${process.status.toLowerCase().replace(/\s+/g, '-')}`;
        }
        const versionTag = document.getElementById('modal-version-tag');
        if (versionTag) {
            versionTag.textContent = `Versão ${process.versao} · Atualizado em ${process.ultima_atualizacao}`;
        }

        // Exibe o modal
        backdrop.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Alternância das duas abas da seção Gestão por Processos
     */
    function setupBpmSectionTabs() {
        const tabBtns = document.querySelectorAll('.section-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const target = btn.getAttribute('data-tab');
                document.querySelectorAll('#gestao-processos .section-tab-panel').forEach(p => {
                    p.classList.toggle('active', p.id === target);
                });
            });
        });
    }

    /**
     * Renderiza as duas abas de Gestão por Processos
     */
    function renderBpmSection() {
        renderModelos();
        renderPopsManuais();
    }

    /**
     * Aba 1: Modelos de Documentos
     */
    function renderModelos() {
        const container = document.getElementById('models-grid');
        if (!container || !state.data || !state.data.modelos) return;

        container.innerHTML = state.data.modelos.map(m => `
            <div class="model-card">
                <div class="model-header">
                    <div class="model-icon"><i class="fa-solid ${m.icone || 'fa-file-lines'}"></i></div>
                    <span class="model-type-tag">${m.tipo}</span>
                </div>
                <h3 class="model-title">${m.titulo}</h3>
                <p class="model-desc">${m.descricao}</p>
                <div class="model-actions">
                    <a href="${m.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                        <i class="fa-solid fa-eye"></i> Visualizar Modelo
                    </a>
                    ${m.download ? `
                        <a href="${m.download}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                            <i class="fa-solid fa-download"></i> Acessar / Baixar
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Aba 2: POPs e Manuais da SESAP/RN
     */
    function renderPopsManuais() {
        const container = document.getElementById('pops-grid');
        if (!container || !state.data || !state.data.pops_manuais) return;

        const filtered = state.data.pops_manuais.filter(item => {
            if (state.popsFront !== 'Todas' && item.frente !== state.popsFront) return false;
            if (state.popsType !== 'Todos' && !item.tipo.includes(state.popsType)) return false;
            if (state.popsSearch) {
                const q = state.popsSearch.toLowerCase();
                const matchTitle = item.titulo.toLowerCase().includes(q);
                const matchDesc = item.descricao.toLowerCase().includes(q);
                const matchFront = item.frente.toLowerCase().includes(q);
                if (!matchTitle && !matchDesc && !matchFront) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="no-results-box" style="grid-column: 1 / -1;">
                    <i class="fa-solid fa-book"></i>
                    <h3>Nenhum POP ou manual encontrado</h3>
                    <p>Tente ajustar os termos da busca ou selecionar outra frente.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(item => `
            <div class="pop-card">
                <div class="pop-card-top">
                    <span class="process-front-tag front-${item.frente.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${item.frente}</span>
                    <span class="badge-mini badge-blue">${item.tipo}</span>
                </div>
                <h3 class="pop-card-title">${item.titulo}</h3>
                <p class="pop-card-desc">${item.descricao}</p>
                <div class="pop-card-actions">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                        <i class="fa-solid fa-eye"></i> Visualizar Documento
                    </a>
                    ${item.download ? `
                        <a href="${item.download}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">
                            <i class="fa-solid fa-download"></i> Download
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    /**
     * Configura filtros de busca para POPs e Manuais
     */
    function setupPopsFilters() {
        const searchInput = document.getElementById('pops-search');
        const frontSelect = document.getElementById('pops-filter-front');
        const typeSelect = document.getElementById('pops-filter-type');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.popsSearch = e.target.value.trim();
                renderPopsManuais();
            });
        }

        if (frontSelect) {
            frontSelect.addEventListener('change', (e) => {
                state.popsFront = e.target.value;
                renderPopsManuais();
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                state.popsType = e.target.value;
                renderPopsManuais();
            });
        }
    }

    /**
     * Renderiza Relatórios do Projeto
     */
    function renderReports(category = 'Todas') {
        const grid = document.getElementById('reports-grid');
        if (!grid || !state.data || !state.data.documentos) return;

        const docs = state.data.documentos.filter(d => {
            if (category !== 'Todas' && d.categoria !== category) return false;
            return true;
        });

        grid.innerHTML = docs.map(doc => `
            <div class="report-card ${doc.destaque ? 'featured-report' : ''}">
                <div class="report-card-top">
                    <span class="report-cat-badge">${doc.categoria}</span>
                    <span class="report-period">${doc.periodo}</span>
                </div>
                <h3 class="report-title">${doc.titulo}</h3>
                <p class="report-desc">${doc.descricao}</p>
                <div class="report-card-meta">
                    <span><i class="fa-solid fa-file-lines"></i> ${doc.paginas}</span>
                    <span><i class="fa-solid fa-code-branch"></i> v${doc.versao}</span>
                </div>
                <div class="report-card-action">
                    <a href="${doc.arquivo}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary">
                        <i class="fa-solid fa-file-pdf"></i> Visualizar Documento
                    </a>
                </div>
            </div>
        `).join('');
    }

    /**
     * Configura botões de filtro dos relatórios
     */
    function setupReportsFilter() {
        const buttons = document.querySelectorAll('.report-filter-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const cat = btn.getAttribute('data-category');
                renderReports(cat);
            });
        });
    }

    /**
     * Renderiza Capacitações (Base de Conhecimento)
     */
    function renderKnowledgeBase() {
        const grid = document.getElementById('knowledge-grid');
        if (!grid || !state.data || !state.data.capacitacoes) return;

        grid.innerHTML = state.data.capacitacoes.map(c => `
            <div class="knowledge-card">
                <div class="knowledge-top">
                    <span class="badge-mini badge-blue">${c.categoria}</span>
                    <span class="knowledge-hours"><i class="fa-solid fa-clock"></i> ${c.carga_horaria}</span>
                </div>
                <h4 class="knowledge-title">${c.titulo}</h4>
                <p class="knowledge-desc">${c.descricao}</p>
                <div class="knowledge-meta">
                    <div class="meta-row"><i class="fa-solid fa-users"></i> <span><strong>Público:</strong> ${c.publico}</span></div>
                    <div class="meta-row"><i class="fa-solid fa-book-open"></i> <span><strong>Material:</strong> ${c.material}</span></div>
                </div>
                <div class="knowledge-action">
                    <a href="#sobre" class="btn btn-sm btn-outline"><i class="fa-solid fa-arrow-right"></i> Saiba Mais</a>
                </div>
            </div>
        `).join('');
    }

    /**
     * Controles do Painel de Indicadores e Alternância de Dashboards
     */
    function setupStreamlitControls() {
        const reloadBtn = document.getElementById('reload-dash-btn');
        const fullscreenBtn = document.getElementById('fullscreen-dash-btn');
        const iframe = document.getElementById('streamlit-iframe');
        const dashContainer = document.getElementById('dash-container');
        const loader = document.getElementById('dash-loader');
        const loaderText = document.getElementById('dash-loader-text');
        const openExternalBtn = document.getElementById('open-dash-external');
        const viewBtns = document.querySelectorAll('.dash-view-btn');

        if (iframe && loader) {
            iframe.addEventListener('load', () => {
                loader.style.display = 'none';
            });
        }

        // Alternância dinâmica entre todos os painéis e dashboards no mesmo lugar
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const targetUrl = btn.getAttribute('data-url');
                const externalUrl = btn.getAttribute('data-external') || targetUrl;
                const type = btn.getAttribute('data-type') || 'web';
                const label = btn.textContent.trim();

                if (loader) {
                    if (loaderText) loaderText.textContent = `Carregando ${label}...`;
                    loader.style.display = 'flex';
                }

                // Ajusta comportamento de corte de rodapé (Streamlit com máscara vs Web Dashboard padrão)
                if (dashContainer) {
                    if (type === 'streamlit') {
                        dashContainer.classList.add('is-streamlit');
                    } else {
                        dashContainer.classList.remove('is-streamlit');
                    }
                }

                if (iframe) {
                    iframe.src = targetUrl;
                }

                if (openExternalBtn) {
                    openExternalBtn.href = externalUrl;
                    openExternalBtn.title = `Abrir ${label} em nova aba`;
                }
            });
        });

        if (reloadBtn && iframe) {
            reloadBtn.addEventListener('click', () => {
                if (loader) {
                    if (loaderText) loaderText.textContent = 'Recarregando painel...';
                    loader.style.display = 'flex';
                }
                iframe.src = iframe.src;
            });
        }

        if (fullscreenBtn && dashContainer) {
            fullscreenBtn.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    dashContainer.requestFullscreen().catch(err => {
                        console.error('Fullscreen error:', err);
                    });
                    fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Sair da Tela Cheia';
                } else {
                    document.exitFullscreen();
                    fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Tela Cheia';
                }
            });

            document.addEventListener('fullscreenchange', () => {
                if (!document.fullscreenElement && fullscreenBtn) {
                    fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Tela Cheia';
                }
            });
        }
    }

    /**
     * Accordion de Ex-Membros da Equipe
     */
    function setupExMembersAccordion() {
        const toggleBtn = document.getElementById('toggle-ex-members');
        const panel = document.getElementById('ex-members-panel');

        if (toggleBtn && panel) {
            toggleBtn.addEventListener('click', () => {
                const isHidden = panel.classList.toggle('hidden');
                toggleBtn.setAttribute('aria-expanded', !isHidden);
                const icon = toggleBtn.querySelector('.toggle-icon i');
                if (icon) {
                    icon.className = isHidden ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
                }
            });
        }
    }

})();
