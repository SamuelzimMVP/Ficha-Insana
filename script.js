// Lista de perícias do sistema
const skills = [
    'Destreza', 'Agilidade', 'Luta', 'Contra-ataque',
    'Inteligência', 'Psicologia', 'Vigor', 'Percepção',
    'Intimidar', 'Poder', 'Sorte', 'Sentido',
    'Medicina', 'Primeiro Socorros', 'Pontaria', 'Furtividade',
    'Lábia', 'Carisma', 'Correr'
];

// Estado do personagem
let character = {
    name: '',
    hpCurrent: 100,
    hpMax: 100,
    sanityCurrent: 100,
    sanityMax: 100,
    manaBlocks: 0,
    skills: {}
};

// Inicializar perícias com valor 0
skills.forEach(skill => {
    character.skills[skill] = 0;
});

// Navegação entre páginas
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    renderSkills();
    populateSkillSelects();
    attachEventListeners();
    loadCharacterFromStorage();
});

function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPage = btn.dataset.page;
            
            // Remover classe active de todos
            navButtons.forEach(b => b.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            
            // Adicionar classe active
            btn.classList.add('active');
            document.getElementById(targetPage).classList.add('active');
        });
    });
}

// Renderizar perícias na ficha
function renderSkills() {
    const container = document.getElementById('skills-container');
    container.innerHTML = '';

    skills.forEach(skill => {
        const skillDiv = document.createElement('div');
        skillDiv.className = 'skill-item';
        skillDiv.innerHTML = `
            <label>${skill}:</label>
            <input type="number" 
                   data-skill="${skill}" 
                   value="${character.skills[skill]}" 
                   min="0" 
                   max="100">
            <button class="dice-btn" data-skill="${skill}" title="Rolar teste de ${skill}">🎲</button>
        `;
        container.appendChild(skillDiv);
    });

    // Adicionar eventos aos inputs
    container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
            const skill = e.target.dataset.skill;
            character.skills[skill] = parseInt(e.target.value) || 0;
        });
    });

    // Adicionar eventos aos botões de dado
    container.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const skill = e.target.dataset.skill;
            quickRollSkill(skill);
        });
    });
}

// Rolagem rápida de perícia (botão ao lado do atributo)
function quickRollSkill(skillName) {
    const skillValue = character.skills[skillName];
    const roll = rollDice(100);
    const result = evaluateSkillRoll(roll, skillValue);
    
    showQuickRollModal(skillName, roll, skillValue, result);
}

function showQuickRollModal(skillName, roll, skillValue, result) {
    const modal = document.getElementById('quick-roll-modal');
    const resultDiv = document.getElementById('quick-roll-result');
    
    let successClass = result.success ? 'result-success' : 'result-failure';
    let successText = result.success ? '✅ SUCESSO' : '❌ FALHA';
    
    let html = `
        <div class="result-title">Teste de ${skillName}</div>
        <div class="result-details">🎲 Resultado do Dado: <strong>${roll}</strong></div>
        <div class="result-details">🎯 Valor da Perícia: <strong>${skillValue}</strong></div>
        <div class="${successClass}">${successText}</div>
    `;
    
    if (result.success) {
        if (result.extreme) {
            html += '<div class="result-success">💎 SUCESSO EXTREMO!</div>';
        } else if (result.good) {
            html += '<div class="result-success">⭐ SUCESSO BOM!</div>';
        }
    }
    
    if (result.critical !== null) {
        html += `<div class="result-success" style="background: rgba(220, 38, 38, 0.2); border-color: var(--accent-red); color: var(--accent-red);">🔥 CRÍTICO NÍVEL ${result.critical}!</div>`;
    }
    
    resultDiv.innerHTML = html;
    modal.classList.add('show');
}

// Fechar modal
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal')) {
        document.getElementById('quick-roll-modal').classList.remove('show');
    }
});

// Popular selects de perícias
function populateSkillSelects() {
    const selects = [
        document.getElementById('skill-select'),
        document.getElementById('advantage-skill')
    ];

    selects.forEach(select => {
        skills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            option.textContent = skill;
            select.appendChild(option);
        });
    });
}

// Anexar event listeners
function attachEventListeners() {
    // Salvar personagem
    document.getElementById('save-character').addEventListener('click', saveCharacter);
    
    // Carregar personagem
    document.getElementById('load-character').addEventListener('click', loadCharacter);
    
    // Limpar ficha
    document.getElementById('clear-character').addEventListener('click', clearCharacter);
    
    // Rolagem de perícia
    document.getElementById('roll-skill').addEventListener('click', rollSkillTest);
    
    // Rolagem com vantagem/desvantagem
    document.getElementById('roll-advantage').addEventListener('click', rollAdvantage);
    
    // Rolagem livre de dados
    document.getElementById('roll-dice').addEventListener('click', rollFreeDice);
    
    // Inputs de status vitais
    document.getElementById('char-name').addEventListener('change', (e) => {
        character.name = e.target.value;
    });
    
    document.getElementById('hp-current').addEventListener('change', (e) => {
        character.hpCurrent = parseInt(e.target.value) || 0;
    });
    
    document.getElementById('hp-max').addEventListener('change', (e) => {
        character.hpMax = parseInt(e.target.value) || 0;
    });
    
    document.getElementById('sanity-current').addEventListener('change', (e) => {
        character.sanityCurrent = parseInt(e.target.value) || 0;
    });
    
    document.getElementById('sanity-max').addEventListener('change', (e) => {
        character.sanityMax = parseInt(e.target.value) || 0;
    });
    
    document.getElementById('mana-blocks').addEventListener('change', (e) => {
        character.manaBlocks = parseInt(e.target.value) || 0;
    });
}

// Função de rolar dado
function rollDice(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// Avaliar resultado de perícia
function evaluateSkillRoll(roll, skillValue) {
    const extreme = Math.floor(skillValue / 3);
    const good = Math.floor((skillValue * 2) / 3);
    
    const result = {
        success: roll <= skillValue,
        good: roll <= good,
        extreme: roll <= extreme,
        critical: getCriticalLevel(roll)
    };
    
    return result;
}

// Determinar nível crítico
function getCriticalLevel(roll) {
    if (roll <= 10) return 0;
    if (roll <= 35) return 1;
    if (roll <= 59) return 2;
    if (roll <= 75) return 3;
    if (roll <= 89) return 4;
    return 5;
}

// Teste de perícia completo
function rollSkillTest() {
    const skillSelect = document.getElementById('skill-select');
    const skillName = skillSelect.value;
    
    if (!skillName) {
        alert('Selecione uma perícia!');
        return;
    }
    
    const skillValue = character.skills[skillName];
    const roll = rollDice(100);
    const result = evaluateSkillRoll(roll, skillValue);
    
    displaySkillResult(skillName, roll, skillValue, result);
}

function displaySkillResult(skillName, roll, skillValue, result) {
    const resultBox = document.getElementById('skill-result');
    
    let successClass = result.success ? 'result-success' : 'result-failure';
    let successText = result.success ? '✅ SUCESSO' : '❌ FALHA';
    
    let html = `
        <div class="result-title">Resultado do Teste de ${skillName}</div>
        <div class="result-details">🎲 Dado: <strong>${roll}</strong></div>
        <div class="result-details">🎯 Perícia: <strong>${skillValue}</strong></div>
        <div class="result-details">💎 Extremo: <strong>${Math.floor(skillValue / 3)}</strong></div>
        <div class="result-details">⭐ Bom: <strong>${Math.floor((skillValue * 2) / 3)}</strong></div>
        <div class="${successClass}">${successText}</div>
    `;
    
    if (result.success) {
        if (result.extreme) {
            html += '<div class="result-success">💎 SUCESSO EXTREMO!</div>';
        } else if (result.good) {
            html += '<div class="result-success">⭐ SUCESSO BOM!</div>';
            
        } else {
            html += '<div class="result-success">✅ SUCESSO NORMAL</div>';
        }
    }
    
    if (result.critical !== null) {
        html += `<div class="result-success" style="background: rgba(220, 38, 38, 0.2); border-color: var(--accent-red); color: var(--accent-red);">🔥 CRÍTICO NÍVEL ${result.critical}</div>`;
    }
    
    resultBox.innerHTML = html;
    resultBox.classList.add('show');
}

// Rolagem com vantagem/desvantagem
function rollAdvantage() {
    const type = document.getElementById('advantage-type').value;
    const count = parseInt(document.getElementById('advantage-count').value);
    const skillName = document.getElementById('advantage-skill').value;
    
    if (!skillName) {
        alert('Selecione uma perícia!');
        return;
    }
    
    if (count < 2) {
        alert('Role pelo menos 2 dados!');
        return;
    }
    
    const skillValue = character.skills[skillName];
    const rolls = [];
    
    for (let i = 0; i < count; i++) {
        rolls.push(rollDice(100));
    }
    
    const finalRoll = type === 'advantage' ? Math.min(...rolls) : Math.max(...rolls);
    const result = evaluateSkillRoll(finalRoll, skillValue);
    
    displayAdvantageResult(skillName, rolls, finalRoll, skillValue, result, type);
}

function displayAdvantageResult(skillName, rolls, finalRoll, skillValue, result, type) {
    const resultBox = document.getElementById('advantage-result');
    const typeText = type === 'advantage' ? 'Vantagem (menor)' : 'Desvantagem (maior)';
    
    let successClass = result.success ? 'result-success' : 'result-failure';
    let successText = result.success ? '✅ SUCESSO' : '❌ FALHA';
    
    let html = `
        <div class="result-title">Rolagem com ${typeText}</div>
        <div class="result-details">🎯 Perícia de ${skillName}: <strong>${skillValue}</strong></div>
        <div class="result-details">🎲 Dados Rolados:</div>
        <div class="dice-results">
    `;
    
    rolls.forEach(roll => {
        const selectedClass = roll === finalRoll ? 'selected' : '';
        html += `<div class="dice-value ${selectedClass}">${roll}</div>`;
    });
    
    html += `
        </div>
        <div class="result-details">✨ Resultado Final: <strong>${finalRoll}</strong></div>
        <div class="${successClass}">${successText}</div>
    `;
    
    if (result.success) {
        if (result.extreme) {
            html += '<div class="result-success">💎 SUCESSO EXTREMO!</div>';
        } else if (result.good) {
            html += '<div class="result-success">⭐ SUCESSO BOM!</div>';
        } else {
            html += '<div class="result-success">✅ SUCESSO NORMAL</div>';
        }
    }
    
    if (result.critical !== null) {
        html += `<div class="result-success" style="background: rgba(220, 38, 38, 0.2); border-color: var(--accent-red); color: var(--accent-red);">🔥 CRÍTICO NÍVEL ${result.critical}</div>`;
    }
    
    resultBox.innerHTML = html;
    resultBox.classList.add('show');
}

// Rolagem livre de dados
function rollFreeDice() {
    const diceType = parseInt(document.getElementById('dice-type').value);
    const diceCount = parseInt(document.getElementById('dice-count').value);
    
    if (diceCount < 1) {
        alert('Role pelo menos 1 dado!');
        return;
    }
    
    const rolls = [];
    let total = 0;
    
    for (let i = 0; i < diceCount; i++) {
        const roll = rollDice(diceType);
        rolls.push(roll);
        total += roll;
    }
    
    displayDiceResult(diceType, diceCount, rolls, total);
}

function displayDiceResult(diceType, diceCount, rolls, total) {
    const resultBox = document.getElementById('dice-result');
    
    let html = `
        <div class="result-title">Rolagem de ${diceCount}D${diceType}</div>
        <div class="result-details">🎲 Resultados Individuais:</div>
        <div class="dice-results">
    `;
    
    rolls.forEach(roll => {
        html += `<div class="dice-value">${roll}</div>`;
    });
    
    html += `
        </div>
        <div class="result-success">📊 Total: ${total}</div>
    `;
    
    resultBox.innerHTML = html;
    resultBox.classList.add('show');
}

// Salvar personagem no localStorage
function saveCharacter() {
    // Atualizar character com valores atuais dos inputs
    character.name = document.getElementById('char-name').value;
    character.hpCurrent = parseInt(document.getElementById('hp-current').value) || 0;
    character.hpMax = parseInt(document.getElementById('hp-max').value) || 0;
    character.sanityCurrent = parseInt(document.getElementById('sanity-current').value) || 0;
    character.sanityMax = parseInt(document.getElementById('sanity-max').value) || 0;
    character.manaBlocks = parseInt(document.getElementById('mana-blocks').value) || 0;
    
    // Salvar no localStorage
    localStorage.setItem('d100_character', JSON.stringify(character));
    alert('✅ Personagem salvo com sucesso!');
}

// Carregar personagem do localStorage
function loadCharacter() {
    const saved = localStorage.getItem('d100_character');
    
    if (!saved) {
        alert('❌ Nenhum personagem salvo encontrado!');
        return;
    }
    
    character = JSON.parse(saved);
    
    // Atualizar interface
    document.getElementById('char-name').value = character.name || '';
    document.getElementById('hp-current').value = character.hpCurrent;
    document.getElementById('hp-max').value = character.hpMax;
    document.getElementById('sanity-current').value = character.sanityCurrent;
    document.getElementById('sanity-max').value = character.sanityMax;
    document.getElementById('mana-blocks').value = character.manaBlocks;
    
    // Atualizar perícias
    document.querySelectorAll('#skills-container input[data-skill]').forEach(input => {
        const skill = input.dataset.skill;
        input.value = character.skills[skill] || 0;
    });
    
    alert('✅ Personagem carregado com sucesso!');
}

// Carregar personagem automaticamente ao iniciar
function loadCharacterFromStorage() {
    const saved = localStorage.getItem('d100_character');
    
    if (saved) {
        character = JSON.parse(saved);
        
        // Atualizar interface
        document.getElementById('char-name').value = character.name || '';
        document.getElementById('hp-current').value = character.hpCurrent;
        document.getElementById('hp-max').value = character.hpMax;
        document.getElementById('sanity-current').value = character.sanityCurrent;
        document.getElementById('sanity-max').value = character.sanityMax;
        document.getElementById('mana-blocks').value = character.manaBlocks;
        
        // Re-renderizar perícias com valores salvos
        renderSkills();
    }
}

// Limpar ficha
function clearCharacter() {
    if (!confirm('⚠️ Tem certeza que deseja limpar toda a ficha?')) {
        return;
    }
    
    // Resetar character
    character = {
        name: '',
        hpCurrent: 100,
        hpMax: 100,
        sanityCurrent: 100,
        sanityMax: 100,
        manaBlocks: 0,
        skills: {}
    };
    
    skills.forEach(skill => {
        character.skills[skill] = 0;
    });
    
    // Limpar localStorage
    localStorage.removeItem('d100_character');
    
    // Atualizar interface
    document.getElementById('char-name').value = '';
    document.getElementById('hp-current').value = 100;
    document.getElementById('hp-max').value = 100;
    document.getElementById('sanity-current').value = 100;
    document.getElementById('sanity-max').value = 100;
    document.getElementById('mana-blocks').value = 0;
    
    // Re-renderizar perícias
    renderSkills();
    
    alert('✅ Ficha limpa com sucesso!');
}