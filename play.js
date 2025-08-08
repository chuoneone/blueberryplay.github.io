// --- play.js 的功能增強版 (支援原因欄位) ---

// --- 設定區 ---
// 請確認這裡的 URL 是您最新部署的 URL
const API_URL = 'https://script.google.com/macros/s/AKfycbywB-x0xMvRt5b4_DoAMCwmZXJJ6bwcU0C8loG9umLxbVLjvwspe9IbZ2mc--Bw3or00Q/exec'; 
// --- 設定區結束 ---

// Global variables
let scores = {};
let records = [];
let players = ['張莘昕', '謝宛庭', '林翠萍', '林晏儀', '黃佳儀', '李欣諭', '陳盈妙', '陳孟欣', '高鈺雅', '洪于茜', '李侑蓁', '陳屏慈', '黃怡茹', '鍾采珍', '李玨瑩'];
let actions = ['飲食', '使用民宿設施（不包含玩遊戲設施）', '玩遊戲', '笑的樣子', '不笑的樣子'];
let lotteryResults = [];

// 【新增】讀取提示框的輔助函式
function showLoading(message = '處理中...') {
    document.getElementById('loadingText').textContent = message;
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showLeaderboardLoading() {
    const loadingHtml = `<div class="text-center py-10"><span class="text-gray-500 font-medium">正在讀取...</span></div>`;
    document.getElementById('mainLeaderboard').innerHTML = loadingHtml;
    document.getElementById('leaderboard').innerHTML = loadingHtml;
    document.getElementById('detailedRecords').innerHTML = loadingHtml;
}

// Page navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId + 'Page').classList.add('active');
    
    document.querySelectorAll('button[id$="Tab"]').forEach(tab => {
        tab.className = 'py-4 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap text-gray-500 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition duration-300';
    });
    document.getElementById(pageId + 'Tab').className = 'py-4 px-3 sm:px-6 font-medium text-sm sm:text-base whitespace-nowrap text-blue-600 border-b-2 border-blue-600';

    if (pageId === 'leaderboard' || pageId === 'score' || pageId === 'allowance') {
        loadData();
    }
}


function showScorePage() {
    document.getElementById('scorePasswordPrompt').classList.remove('hidden');
}

function hideScorePasswordPrompt() {
    document.getElementById('scorePasswordPrompt').classList.add('hidden');
    document.getElementById('scorePasswordInput').value = '';
}

function checkScorePassword() {
    const password = document.getElementById('scorePasswordInput').value;
    if (password === '8787') {
        hideScorePasswordPrompt();
        showPage('score');
    } else {
        alert('密碼錯誤！');
        document.getElementById('scorePasswordInput').value = '';
    }
}

function runFullLottery() {
    if (lotteryResults.length > 0 && !confirm('已經執行過抽籤了，確定要重新抽籤嗎？')) {
        return;
    }
    lotteryResults = [];
    let currentPlayers = [...players];
    let potentialTargets = [...players];
    for (let i = currentPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potentialTargets[i], potentialTargets[j]] = [potentialTargets[j], potentialTargets[i]];
    }
    currentPlayers.forEach((player, i) => {
        let target = potentialTargets[i];
        if (player === target) {
            const swapIndex = (i + 1) % potentialTargets.length;
            [potentialTargets[i], potentialTargets[swapIndex]] = [potentialTargets[swapIndex], potentialTargets[i]];
            target = potentialTargets[i];
        }
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        lotteryResults.push({ player, target, action: randomAction });
    });
    displayFullLotteryResults();
}

function displayFullLotteryResults() {
    const container = document.getElementById('fullLotteryResults');
    if (lotteryResults.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">尚未執行抽籤</div>';
        return;
    }
    let html = `<div class="overflow-x-auto"><table class="min-w-full bg-white border border-gray-200 rounded-lg"><thead class="bg-gray-100"><tr><th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">狗仔 (玩家)</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">女明星 (目標)</th><th class="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">指定動作</th></tr></thead><tbody class="divide-y divide-gray-200">`;
    lotteryResults.forEach(result => {
        html += `<tr><td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900">${result.player}</td><td class="px-6 py-4 whitespace-nowrap font-bold text-rose-600">${result.target}</td><td class="px-6 py-4 whitespace-nowrap text-purple-600">${result.action}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scorePasswordInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') checkScorePassword();
    });
    loadData();
});

async function loadData() {
    showLeaderboardLoading(); // 顯示「正在讀取...」
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`伺服器錯誤: ${response.statusText}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        scores = data.scores || {};
        records = data.records || [];
        updateLeaderboard();
        updateMainLeaderboard();
        updateDetailedRecords();
    } catch (error) {
        console.error('Error loading data:', error);
        const errorHtml = `<div class="text-center py-10"><span class="text-red-500 font-medium">讀取資料失敗: ${error.message}</span></div>`;
        document.getElementById('mainLeaderboard').innerHTML = errorHtml;
        document.getElementById('leaderboard').innerHTML = errorHtml;
        document.getElementById('detailedRecords').innerHTML = errorHtml;
    }
}
        
// 【已修改】加入讀取提示和「原因」欄位
async function submitScore() {
    const player = document.getElementById('playerSelect').value;
    const scoreAmountInput = document.getElementById('scoreAmount');
    const reasonInput = document.getElementById('reasonInput'); // 取得原因輸入框
    const amount = parseInt(scoreAmountInput.value, 10);
    const reason = reasonInput.value.trim(); // 取得原因文字

    if (!player) {
        alert('請選擇狗仔！');
        return;
    }
    if (isNaN(amount) || amount === 0) { // 允許負數，但不允許0
        alert('請輸入有效的金額！');
        return;
    }
    if (!reason) { // 確保原因不為空
        alert('請輸入原因！');
        return;
    }

    showLoading('成績送出中...');
    
    const formData = new FormData();
    formData.append('action', 'submitScore');
    formData.append('player', player);
    formData.append('totalScore', amount);
    // 將原因作為 label 傳送
    formData.append('bonuses', JSON.stringify([{ label: reason, score: amount }]));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        alert(`成績已登錄！${player} 變動 ${amount.toLocaleString()} 元`);
        await loadData();
        resetForm();
    } catch (error) {
        console.error('Error submitting score:', error);
        alert(`提交失敗！\n錯誤訊息: ${error.message}`);
    } finally {
        hideLoading();
    }
}
        
async function deleteRecord(recordId) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;
    
    showLoading('刪除中...');
    
    try {
        const formData = new FormData();
        formData.append('action', 'deleteRecord');
        formData.append('id', recordId);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        alert('記錄已刪除！');
        await loadData();
    } catch (error) {
        alert(`刪除失敗: ${error.message}`);
    } finally {
        hideLoading();
    }
}

async function resetAllScores() {
    if (!confirm('確定要重置所有成績嗎？這個動作無法復原！')) return;
    
    showLoading('重置中...');

    try {
        const formData = new FormData();
        formData.append('action', 'resetAllScores');

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
        alert('所有成績已重置！');
        await loadData();
        resetForm();
    } catch (error) {
        alert(`重置失敗: ${error.message}`);
    } finally {
        hideLoading();
    }
}

function updateLeaderboardContent(container) {
    if (!scores || Object.keys(scores).length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-8">尚無成績記錄</div>';
        return;
    }
    const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    container.innerHTML = '';
    sortedPlayers.forEach(([player, score], index) => {
        const rank = index + 1;
        let rankColor = 'bg-gray-100', rankIcon = '🏅';
        if (rank === 1) { rankColor = 'bg-gradient-to-r from-yellow-100 to-amber-100 border-yellow-300'; rankIcon = '🥇'; }
        else if (rank === 2) { rankColor = 'bg-gradient-to-r from-gray-100 to-slate-100 border-gray-300'; rankIcon = '🥈'; }
        else if (rank === 3) { rankColor = 'bg-gradient-to-r from-orange-100 to-amber-100 border-orange-300'; rankIcon = '🥉'; }
        const photosCount = records.filter(r => r.player === player).length;
        const div = document.createElement('div');
        div.className = `score-item ${rankColor} rounded-lg p-4 border-2`;
        div.innerHTML = `<div class="flex items-center justify-between"><div class="flex items-center"><span class="text-2xl mr-3">${rankIcon}</span><div><span class="font-bold text-lg text-gray-800">${rank}. ${player}</span><div class="text-sm text-gray-600">${photosCount} 筆記錄</div></div></div><div class="text-right"><div class="text-2xl font-bold text-blue-600">${score.toLocaleString()}</div><div class="text-sm text-gray-500">總獎金</div></div></div>`;
        container.appendChild(div);
    });
}
function updateLeaderboard() { updateLeaderboardContent(document.getElementById('leaderboard')); }
function updateMainLeaderboard() { updateLeaderboardContent(document.getElementById('mainLeaderboard')); }

// 【已修改】優化詳細記錄的顯示方式
function updateDetailedRecords() {
    const container = document.getElementById('detailedRecords');
    if (!records || records.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-8">尚無詳細記錄</div>';
        return;
    }
    container.innerHTML = '';
    const groupedRecords = {};
    records.forEach(record => {
        if (!groupedRecords[record.player]) groupedRecords[record.player] = [];
        groupedRecords[record.player].push(record);
    });
    Object.keys(groupedRecords).sort().forEach(player => {
        const playerRecords = groupedRecords[player];
        const playerDiv = document.createElement('div');
        playerDiv.className = 'bg-gray-50 rounded-lg p-4 border border-gray-200';
        let recordsHtml = '';
        playerRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(record => {
            // 從 bonuses 陣列中提取原因和分數
            const reasonText = (record.bonuses && record.bonuses.length > 0) 
                               ? record.bonuses[0].label 
                               : '手動登錄';
            const scoreText = record.totalScore > 0 
                              ? `+${record.totalScore.toLocaleString()}` 
                              : record.totalScore.toLocaleString();
            const scoreColor = record.totalScore > 0 ? 'text-green-600' : 'text-red-600';

            recordsHtml += `
                <div class="bg-white rounded-lg p-3 border border-gray-200 mb-2">
                    <div class="flex items-start justify-between">
                        <span class="font-medium text-gray-800 flex-1 pr-4">${reasonText}</span>
                        <div class="flex items-center gap-3 flex-shrink-0">
                            <span class="font-bold text-lg ${scoreColor}">${scoreText}元</span>
                            <button onclick="deleteRecord(${record.id})" class="text-gray-400 hover:text-red-600 text-lg leading-none">🗑️</button>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 text-right mt-1">${new Date(record.timestamp).toLocaleString('zh-TW')}</div>
                </div>
            `;
        });
        playerDiv.innerHTML = `<h4 class="font-bold text-lg text-gray-800 mb-3">${player} (總獎金: ${scores[player] ? scores[player].toLocaleString() : 0}元)</h4>${recordsHtml}`;
        container.appendChild(playerDiv);
    });
}

// 【已修改】一併清除原因欄位
function resetForm() {
    document.getElementById('playerSelect').value = '';
    document.getElementById('scoreAmount').value = '';
    document.getElementById('reasonInput').value = ''; // 清除原因輸入框
}