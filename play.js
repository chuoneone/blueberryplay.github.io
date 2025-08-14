// --- play.js 的功能增強版 (支援原因欄位) ---

// --- 設定區 ---
// 請確認這裡的 URL 是您最新部署的 URL
const API_URL = 'https://script.google.com/macros/s/AKfycbywB-x0xMvRt5b4_DoAMCwmZXJJ6bwcU0C8loG9umLxbVLjvwspe9IbZ2mc--Bw3or00Q/exec'; 
// --- 設定區結束 ---

// Global variables
let scores = {};
let records = [];
let players = ['張莘昕', '謝宛庭', '林翠萍', '林晏儀', '黃佳儀', '李欣諭', '陳盈妙', '陳孟欣', '高鈺雅', '洪于茜', '李侑蓁', '黃怡茹', '鍾采珍', '李玨瑩','林芮儀',];
// let actions = ['飲食', '使用民宿設施（不包含玩遊戲設施）', '玩遊戲', '笑的樣子', '不笑的樣子']; // 抽籤功能已移除

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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('scorePasswordInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') checkScorePassword();
    });
    loadData();
});

async function loadData() {
    showLeaderboardLoading();
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
        
async function submitScore() {
    const player = document.getElementById('playerSelect').value;
    const scoreAmountInput = document.getElementById('scoreAmount');
    const amount = parseInt(scoreAmountInput.value, 10);

    const isPhotoChecked = document.getElementById('reasonCheckboxPhoto').checked;
    const otherReason = document.getElementById('reasonInput').value.trim();
    
    let reasonParts = [];
    if (isPhotoChecked) {
        reasonParts.push('照片');
    }
    if (otherReason) {
        reasonParts.push(otherReason);
    }
    let reason = reasonParts.join(' - ');

    if (!reason) {
        reason = '手動登錄';
    }

    if (!player) {
        alert('請選擇狗仔！');
        return;
    }
    if (isNaN(amount) || amount === 0) {
        alert('請輸入有效的金額！');
        return;
    }

    showLoading('成績送出中...');
    
    const formData = new FormData();
    formData.append('action', 'submitScore');
    formData.append('player', player);
    formData.append('totalScore', amount);
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

// 【已修改】優化詳細記錄的顯示方式，使其更緊湊
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
        playerDiv.className = 'bg-gray-50 rounded-lg p-3 border border-gray-200'; // 縮小padding
        let recordsHtml = '';
        playerRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach(record => {
            const reasonText = (record.bonuses && record.bonuses.length > 0) 
                                ? record.bonuses[0].label 
                                : '手動登錄';
            const scoreText = record.totalScore > 0 
                                ? `+${record.totalScore.toLocaleString()}` 
                                : record.totalScore.toLocaleString();
            const scoreColor = record.totalScore > 0 ? 'text-green-600' : 'text-red-600';

            // 使用更緊湊的版面
            recordsHtml += `
                <div class="bg-white rounded-md p-2 border border-gray-200 mb-1">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-800 flex-1 pr-2">${reasonText}</span>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="font-semibold text-base ${scoreColor}">${scoreText}元</span>
                            <button onclick="deleteRecord(${record.id})" class="text-gray-400 hover:text-red-600 text-base leading-none">🗑️</button>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 text-right">${new Date(record.timestamp).toLocaleString('zh-TW')}</div>
                </div>
            `;
        });
        // 縮小標題字體和下方間距
        playerDiv.innerHTML = `<h4 class="font-bold text-base text-gray-800 mb-2">${player} (總獎金: ${scores[player] ? scores[player].toLocaleString() : 0}元)</h4>${recordsHtml}`;
        container.appendChild(playerDiv);
    });
}

function resetForm() {
    document.getElementById('playerSelect').value = '';
    document.getElementById('scoreAmount').value = '';
    document.getElementById('reasonCheckboxPhoto').checked = false;
    document.getElementById('reasonInput').value = '';
}