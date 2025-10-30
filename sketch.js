let quizTable;       // 儲存 CSV 數據的 p5.Table 物件
let questions = [];  // 儲存處理後的題目物件陣列
let currentQuestionIndex = 0;
let score = 0;
// 'quiz': 測驗進行中, 'correct_feedback': 答對短暫回饋, 'incorrect_feedback': 答錯短暫回饋, 'result': 顯示最終結果
let quizState = 'quiz'; 
let selectedOption = null; // 當前被選取的選項標籤 (A, B, C, D)
let trail = []; // 用於游標殘影的軌跡陣列

const OPTION_HEIGHT = 60;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// 1. 資料載入：在 setup 之前載入 CSV 檔案
function preload() {
    // 'csv' 指定格式，'header' 指定有標頭行
    quizTable = loadTable('question.csv', 'csv', 'header');
}

function setup() {
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    noStroke();
    textAlign(LEFT, CENTER);
    
    // 處理 CSV 數據並建立題目物件
    if (quizTable.getRowCount() > 0) {
        for (let i = 0; i < quizTable.getRowCount(); i++) {
            let row = quizTable.getRow(i);
            questions.push({
                question: row.getString('question'),
                options: [
                    { label: 'A', text: row.getString('optionA') },
                    { label: 'B', text: row.getString('optionB') },
                    { label: 'C', text: row.getString('optionC') },
                    { label: 'D', text: row.getString('optionD') }
                ],
                answer: row.getString('answer'), // 正確答案文本
                userAnswer: null, // 用戶選擇的答案文本
                isAnswered: false
            });
        }
    } else {
        console.error("CSV 檔案沒有數據或讀取失敗！");
    }
}

// 2. 主要繪圖迴圈
function draw() {
    background(240); // 淺灰色背景
    
    drawCursorEffect(); // 游標特效
    
    switch (quizState) {
        case 'quiz':
            drawQuiz();
            break;
        case 'correct_feedback':
        case 'incorrect_feedback':
            drawQuestionFeedback(); // 使用修正後的函數
            break;
        case 'result':
            drawFinalResult();
            break;
    }
}

// 3. 游標殘影特效
function drawCursorEffect() {
    // 僅在測驗進行時顯示自定義游標
    if (quizState === 'quiz') {
        noCursor(); // 隱藏系統游標
        trail.push(createVector(mouseX, mouseY));
        
        if (trail.length > 20) {
            trail.shift(); 
        }
        
        for (let i = 0; i < trail.length; i++) {
            let pos = trail[i];
            let diameter = map(i, 0, trail.length, 2, 10);
            let alpha = map(i, 0, trail.length, 0, 150);
            
            fill(255, 100, 150, alpha); // 粉色漸變殘影
            ellipse(pos.x, pos.y, diameter, diameter);
        }
        
        // 繪製游標頭部
        fill(255, 50, 100);
        ellipse(mouseX, mouseY, 15, 15);
    } else {
        cursor(ARROW); // 顯示系統游標
        trail = [];
    }
}

// 4. 繪製測驗界面
function drawQuiz() {
    if (currentQuestionIndex >= questions.length) {
        // 測驗結束，計算成績並進入結果狀態
        let correctCount = questions.filter(q => q.userAnswer === q.answer).length;
        score = (correctCount / questions.length) * 100;
        quizState = 'result';
        return;
    }

    let q = questions[currentQuestionIndex];
    let x = 50;
    let y = 50;
    let rectW = width - 2 * x;
    
    // 顯示題目進度
    textSize(24);
    fill(50);
    text(`第 ${currentQuestionIndex + 1} 題 / 共 ${questions.length} 題`, x, y);
    
    // 顯示題目內容
    y += 50;
    textSize(28);
    text(q.question, x, y);
    y += 50; // 選項的起始 Y 坐標

    // 顯示選項
    textSize(20);
    for (let i = 0; i < q.options.length; i++) {
        let opt = q.options[i];
        let rectY = y + i * OPTION_HEIGHT;
        let isHover = mouseX > x && mouseX < x + rectW && mouseY > rectY && mouseY < rectY + OPTION_HEIGHT - 10;
        let isSelected = selectedOption === opt.label;
        
        push();
        rectMode(CORNER);
        
        // 選項特效：懸停變色 / 選中高亮
        if (isHover) {
            fill(200, 220, 255, 150); // 懸停顏色
        } else if (isSelected) {
            fill(100, 150, 255, 200); // 選中顏色
        } else {
            fill(255);
        }
        
        // 繪製選項底框
        stroke(150);
        strokeWeight(1);
        rect(x, rectY, rectW, OPTION_HEIGHT - 10, 8); // 圓角矩形
        
        // 繪製選項文本
        noStroke();
        fill(50);
        text(`${opt.label}. ${opt.text}`, x + 15, rectY + OPTION_HEIGHT / 2 - 5);
        pop();
    }
}

// 5. 處理滑鼠點擊 (選取選項)
function mousePressed() {
    if (quizState === 'quiz' && currentQuestionIndex < questions.length) {
        let x = 50;
        let y = 50 + 50 + 50; // 選項的起始 Y 坐標
        let rectW = width - 2 * x;
        let q = questions[currentQuestionIndex];
        
        for (let i = 0; i < q.options.length; i++) {
            let opt = q.options[i];
            let rectY = y + i * OPTION_HEIGHT;
            
            // 檢查是否點擊在選項上
            if (mouseX > x && mouseX < x + rectW && mouseY > rectY && mouseY < rectY + OPTION_HEIGHT - 10) {
                
                // 如果題目還沒回答
                if (!q.isAnswered) {
                    selectedOption = opt.label;
                    q.userAnswer = opt.text;
                    q.isAnswered = true;

                    // 判斷對錯並設定回饋狀態
                    if (q.userAnswer === q.answer) {
                        quizState = 'correct_feedback';
                    } else {
                        quizState = 'incorrect_feedback';
                    }

                    // 短暫顯示回饋動畫 (例如 1 秒) 後自動跳轉下一題
                    setTimeout(() => {
                        currentQuestionIndex++;
                        selectedOption = null;
                        quizState = 'quiz';
                    }, 1000); 
                }
                break;
            }
        }
    } else if (quizState === 'result') {
        // 檢查是否點擊了「重新開始」按鈕
        let btnX = width / 2;
        let btnY = height - 50;
        let btnW = 180;
        let btnH = 50;

        if (mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && 
            mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2) {
            restartQuiz();
        }
    }
}

// 6. 答題後的回饋動畫 (已修正/優化: 新增正確答案高亮顯示)
function drawQuestionFeedback() {
    // 依然繪製測驗畫面，顯示題目和選項
    drawQuiz(); 

    let q = questions[currentQuestionIndex];
    let x = 50;
    let yOptionsStart = 50 + 50 + 50; // 選項的起始 Y 坐標
    let rectW = width - 2 * x;

    // --- 【答案高亮邏輯】 ---
    for (let i = 0; i < q.options.length; i++) {
        let opt = q.options[i];
        let rectY = yOptionsStart + i * OPTION_HEIGHT;

        let isCorrect = (opt.text === q.answer);
        let isUserChoice = (opt.label === selectedOption);


        if (isCorrect || (isUserChoice && !isCorrect)) { // 只處理正確答案或錯誤的用戶選擇
            push();
            rectMode(CORNER);
            
            // 正確答案用綠色高亮
            if (isCorrect) {
                fill(150, 255, 150, 255); 
                stroke(0, 150, 0); 
                strokeWeight(3);
            } 
            // 答錯時，用戶選擇的錯誤答案用紅色高亮 
            else if (isUserChoice && !isCorrect) { 
                fill(255, 150, 150, 255);
                stroke(150, 0, 0);
                strokeWeight(3);
            }

            rect(x, rectY, rectW, OPTION_HEIGHT - 10, 8); // 繪製高亮邊框/底色

            // 重新繪製選項文本，確保在高亮框上方
            noStroke();
            fill(50);
            text(`${opt.label}. ${opt.text}`, x + 15, rectY + OPTION_HEIGHT / 2 - 5);
            pop();
        }
    }
    // --- 【高亮邏輯結束】 ---


    // 繪製回饋覆蓋層 (半透明)
    let feedbackText = "";
    let feedbackColor;
    let scaleFactor = sin(frameCount * 0.2) * 0.1 + 1; 

    if (quizState === 'correct_feedback') {
        feedbackText = "✅ 答對了！";
        feedbackColor = color(0, 255, 0, 100); 
    } else if (quizState === 'incorrect_feedback') {
        feedbackText = "❌ 答錯了！正確答案已標示。";
        feedbackColor = color(255, 0, 0, 100); 
    }

    fill(feedbackColor);
    rectMode(CENTER);
    rect(width / 2, height / 2, width, height); 

    push();
    textAlign(CENTER, CENTER);
    textSize(50 * scaleFactor);
    fill(255);
    text(feedbackText, width / 2, height / 2);
    pop();
}

// 7. 最終結果畫面 (稱讚或鼓勵動畫)
function drawFinalResult() {
    textAlign(CENTER, CENTER);

    // 成績高 (>= 80分) - 稱讚動畫 (彩帶/煙花)
    if (score >= 80) {
        // 稱讚標題
        textSize(48);
        fill(255, 193, 7); // 金黃色
        text(`💯 完美！你的得分：${score.toFixed(0)} 分！`, width / 2, height / 2 - 100);
        
        // 星星粒子動畫 (簡化版)
        for (let i = 0; i < 5; i++) {
            let sparkleX = random(width);
            let sparkleY = random(height);
            let sparkleSize = sin(frameCount * 0.1 + i) * 10 + 5;
            fill(255, 255, 0, 200);
            ellipse(sparkleX, sparkleY, sparkleSize, sparkleSize);
        }

        textSize(24);
        fill(50);
        text("你真是個 p5.js 高手！繼續保持！", width / 2, height / 2);

    } else { // 成績低 (< 80分) - 鼓勵動畫 (微笑/氣泡)
        // 鼓勵標題
        textSize(48);
        fill(0, 150, 255); // 藍色
        text(`👍 加油！你的得分：${score.toFixed(0)} 分！`, width / 2, height / 2 - 100);
        
        // 氣泡鼓勵動畫 (代表持續學習和成長)
        for (let i = 0; i < 10; i++) {
            let bubbleSize = (i * 5 + frameCount * 0.5) % 50 + 10;
            let bubbleX = width / 2 + sin(frameCount * 0.05 + i) * 100;
            let bubbleY = (height + frameCount * 30 + i * 50) % (height + 200) - 100;
            fill(0, 150, 255, 80);
            ellipse(bubbleX, bubbleY, bubbleSize, bubbleSize);
        }

        textSize(24);
        fill(50);
        text("別灰心！多練習幾次就會更進步！", width / 2, height / 2);
    }
    
    // 繪製重新開始按鈕
    drawRestartButton();
}

// 8. 繪製重新開始按鈕
function drawRestartButton() {
    let btnX = width / 2;
    let btnY = height - 50;
    let btnW = 180;
    let btnH = 50;
    
    let isHover = mouseX > btnX - btnW / 2 && mouseX < btnX + btnW / 2 && 
                  mouseY > btnY - btnH / 2 && mouseY < btnY + btnH / 2;
    
    // 按鈕顏色和 Hover 特效
    if (isHover) {
        fill(255, 100, 100); 
        cursor(HAND);
    } else {
        fill(200, 50, 50); 
        cursor(ARROW);
    }
    
    // 繪製按鈕
    rectMode(CENTER);
    rect(btnX, btnY, btnW, btnH, 10);
    
    // 繪製文本
    fill(255);
    textSize(22);
    text("重新開始測驗", btnX, btnY);
}

// 9. 重新開始邏輯
function restartQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    quizState = 'quiz';
    selectedOption = null;
    // 重置所有題目的回答狀態
    questions.forEach(q => {
        q.userAnswer = null;
        q.isAnswered = false;
    });
}