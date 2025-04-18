document.addEventListener('DOMContentLoaded', function() {
    // DOM 요소
    const setupModal = document.getElementById('setup-modal');
    const resultsModal = document.getElementById('results-modal');
    const raceTrack = document.getElementById('race-track');
    const finishLine = document.getElementById('finish-line');
    const raceLog = document.getElementById('race-log');
    const resultsList = document.getElementById('results-list');
    const catCountInput = document.getElementById('cat-count');
    const catNamesContainer = document.getElementById('cat-names-container');
    const startRaceBtn = document.getElementById('start-race');
    const newRaceBtn = document.getElementById('new-race');
    const closeResultsBtn = document.getElementById('close-results');
    const timerElement = document.getElementById('timer');
    const raceRankingElement = document.getElementById('race-ranking');
    const collapsibleBtn = document.querySelector('.collapsible-btn');

    // 접기/펼치기 기능 설정
    if (collapsibleBtn) {
        // 모바일 환경에서는 기본적으로 접혀있도록 설정
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) {
            // 데스크톱에서는 기본적으로 펼쳐있도록 설정
            collapsibleBtn.classList.add('collapsible-active');
            const content = collapsibleBtn.nextElementSibling;
            content.style.maxHeight = content.scrollHeight + "px";
        }

        // 접기/펼치기 버튼 클릭 이벤트
        collapsibleBtn.addEventListener('click', function() {
            this.classList.toggle('collapsible-active');
            const content = this.nextElementSibling;
            
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    // 게임 상태
    let cats = [];
    let finishedCats = [];
    let gameOver = false;
    let gameStarted = false;
    let trackWidth;
    let finishLinePosition;
    let raceStartTime;
    let raceTime = 0;
    let timerInterval;
    
    // 이벤트 타이머 ID 저장
    let eventTimers = {
        catMadness: null,
        lightning: null,
        rainbow: null
    };
    
    // 중계 멘트 데이터
    const commentaries = {
        start: [
            "경주가 시작되었습니다! 모든 고양이들이 힘차게 출발합니다!",
            "드디어 신호와 함께 고양이들이 결승선을 향해 달리기 시작했습니다!",
            "짜릿한 경주의 시작! 어느 고양이가 1등으로 들어올지 기대됩니다!"
        ],
        exhausted: [
            "{name}의 체력이 완전히 바닥났습니다! 잠시 쉬어가는 시간이 필요해 보입니다!",
            "이런! {name}(이)가 지쳐서 멈췄습니다! 회복이 필요한 상황입니다!",
            "저런! {name}의 체력이 소진되었습니다! 잠시 휴식이 필요해 보입니다!"
        ],
        recovered: [
            "{name}(이)가 체력을 회복하고 다시 달리기 시작합니다! 과연 따라잡을 수 있을까요?",
            "휴식을 마친 {name}(이)가 재출발합니다! 얼마나 빠르게 따라잡을 수 있을지 주목해보겠습니다!",
            "{name}(이)가 원기를 회복하고 다시 달립니다! 아직 포기하기엔 이릅니다!"
        ],
        catMadness: [
            "이게 무슨 일입니까! {name}에게 광묘병이 발병해 체력이 소진되거나 2초가 지날 때까지 뒤로 달립니다!",
            "어머나! {name}(이)가 갑자기 방향을 바꿔 뒤로 달리기 시작했습니다! 체력이 소진되거나 2초가 지날 때까지 광묘병 상태가 지속됩니다!",
            "믿기 힘든 상황! {name}(이)가 광묘병에 걸려 체력이 소진되거나 2초가 지날 때까지 뒤로 달립니다!"
        ],
        catMadnessCured: [
            "다행히 {name}의 광묘병이 치료되었습니다! 다시 정상적으로 달릴 수 있게 되었습니다!",
            "{name}의 광묘병이 치료되었습니다! 이제 올바른 방향으로 달릴 수 있습니다!",
            "광묘병에서 회복된 {name}! 이제 다시 결승선을 향해 달릴 수 있습니다!"
        ],
        lightning: [
            "번개 발생! {name}에게 번개가 떨어졌습니다! 3초간 움직일 수 없게 되었습니다!",
            "이런! {name}(이)가 갑자기 나타난 번개에 맞았습니다! 잠시 기절한 상태입니다!",
            "천둥번개! {name}(이)가 번개에 맞아 잠시 멈춰 섰습니다!"
        ],
        lightningRecovered: [
            "{name}(이)가 번개의 충격에서 회복되어 다시 달리기 시작합니다!",
            "번개의 충격에서 벗어난 {name}(이)가 다시 경주에 합류합니다!",
            "{name}(이)가 정신을 차리고 다시 경주를 이어갑니다! 아직 끝나지 않았습니다!"
        ],
        rainbow: [
            "{name}(이)가 무지개를 획득했습니다! 1초간 속도가 2배 증가합니다!",
            "놀라운 일이 벌어졌습니다! {name}(이)가 무지개 부스트를 얻어 빠르게 달리고 있습니다!",
            "와! {name}(이)가 무지개 파워를 흡수해 순식간에 가속하고 있습니다!"
        ],
        finish: [
            "와! {name}(이)가 {rank}등으로 결승선을 통과했습니다! 경주 시간은 {time}초입니다!",
            "축하합니다! {name}(이)가 {rank}등으로 결승선을 통과했습니다! 기록은 {time}초입니다!",
            "드디어! {name}(이)가 {rank}등으로 골인했습니다! 최종 시간은 {time}초입니다!"
        ],
        allFinished: [
            "모든 고양이가 경주를 마쳤습니다! 최종 결과를 확인하세요!",
            "짜릿했던 경주가 끝났습니다! 모든 참가자가 결승선을 통과했습니다!",
            "멋진 경주였습니다! 모든 고양이들이 완주에 성공했습니다!"
        ]
    };

    // 고양이 수 변경 시 이름 입력 필드 업데이트
    catCountInput.addEventListener('change', updateCatNameInputs);

    // 게임 시작 버튼 클릭
    startRaceBtn.addEventListener('click', startRace);
    
    // 새 게임 버튼 클릭
    newRaceBtn.addEventListener('click', resetGame);

    // 닫기 버튼 클릭
    closeResultsBtn.addEventListener('click', function() {
        resultsModal.classList.add('hidden');
    });

    // 고양이 이름 입력 필드 업데이트 함수
    function updateCatNameInputs() {
        const count = parseInt(catCountInput.value);
        
        // 유효한 고양이 수 확인
        if (count < 2) catCountInput.value = 2;
        if (count > 8) catCountInput.value = 8;
        
        const validCount = parseInt(catCountInput.value);
        
        // 기존 입력 필드 제거
        catNamesContainer.innerHTML = '';
        
        // 새 입력 필드 생성
        for (let i = 1; i <= validCount; i++) {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.setAttribute('for', `cat-name-${i}`);
            label.textContent = `고양이 ${i} 이름:`;
            
            const input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('id', `cat-name-${i}`);
            input.value = `냥이${i}`;
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            catNamesContainer.appendChild(formGroup);
        }
    }

    // 타이머 업데이트 함수
    function updateTimer() {
        raceTime = (Date.now() - raceStartTime) / 1000;
        timerElement.textContent = `시간: ${raceTime.toFixed(2)}초`;
    }
    
    // 랭킹 업데이트 함수
    function updateRanking() {
        raceRankingElement.innerHTML = '';
        
        if (finishedCats.length > 0) {
            finishedCats.forEach(cat => {
                const rankEntry = document.createElement('p');
                rankEntry.textContent = `${cat.rank}위: ${cat.name} (${cat.finishTime.toFixed(2)}초)`;
                raceRankingElement.appendChild(rankEntry);
            });
        }
    }
    
    // 랜덤 멘트 선택 함수
    function getRandomCommentary(type, data = {}) {
        const comments = commentaries[type];
        let comment = comments[Math.floor(Math.random() * comments.length)];
        
        // 데이터 치환
        for (const [key, value] of Object.entries(data)) {
            comment = comment.replace(`{${key}}`, value);
        }
        
        return comment;
    }

    // 게임 시작 함수
    function startRace() {
        // 이벤트 타이머 제거
        clearEventTimers();
        
        // 게임 상태 초기화
        cats = [];
        finishedCats = [];
        gameOver = false;
        gameStarted = true;
        raceStartTime = Date.now();
        raceTime = 0;
        raceTrack.innerHTML = '';
        raceLog.innerHTML = '';
        raceRankingElement.innerHTML = '';
        
        // 타이머 엘리먼트 추가
        raceTrack.appendChild(timerElement);
        raceTrack.appendChild(raceRankingElement);
        
        // 결승선 추가
        raceTrack.appendChild(finishLine);
        
        // 타이머 시작
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTimer, 10); // 10ms마다 업데이트 (100fps)
        
        // 트랙 너비 계산 (수정: 결승선 위치 계산 방법 개선)
        trackWidth = raceTrack.clientWidth;
        
        // 수정: 결승선 위치를 올바르게 계산
        // finishLine.offsetLeft는 부모 요소(raceTrack)에 대한 상대 위치
        finishLinePosition = parseInt(window.getComputedStyle(finishLine).right) + finishLine.offsetWidth;
        
        console.log('트랙 너비:', trackWidth);
        console.log('결승선 위치:', finishLinePosition);

        // 디바이스 타입 확인 (모바일/데스크톱)
        const isMobile = window.innerWidth <= 768;
        
        // 고양이 생성
        const catCount = parseInt(catCountInput.value);
        const trackHeight = raceTrack.clientHeight;
        const catHeight = trackHeight / catCount;
        
        for (let i = 1; i <= catCount; i++) {
            const nameInput = document.getElementById(`cat-name-${i}`);
            const name = nameInput ? nameInput.value : `냥이${i}`;
            
            // 초기 속도: 모바일에서는 더 느리게 설정
            const baseSpeed = isMobile ? 0.5 : 1;
            const randomSpeed = baseSpeed + Math.random() * (isMobile ? 0.3 : 0.5);
            
            // 고양이 객체 생성
            const cat = {
                id: i,
                name: name,
                position: 0,
                speed: randomSpeed, // 모바일에서는 더 느린 속도로 시작
                energy: 100, // 체력
                isExhausted: false, // 체력 소진 상태
                isCatMadness: false, // 광묘병 상태
                isLightningHit: false, // 번개 맞은 상태
                isRainbowBoost: false, // 무지개 부스트 상태
                finished: false, // 결승선 통과 여부
                rank: null, // 순위
                finishTime: null, // 완주 시간
                element: null, // DOM 요소
                energyBar: null, // 체력 게이지 DOM 요소
                effectIcons: null, // 이펙트 아이콘 컨테이너
                statusElement: null, // 상태 표시 엘리먼트
                top: (i - 1) * catHeight + (catHeight / 2) - 35 // 고양이의 세로 위치
            };
            
            // 고양이 DOM 요소 생성
            const catElement = document.createElement('div');
            catElement.className = 'cat';
            catElement.style.top = `${cat.top}px`;
            
            const catIcon = document.createElement('div');
            catIcon.className = 'cat-icon';
            const catImg = document.createElement('img');
            catImg.src = 'images/cats/cat-normal.png';
            catImg.alt = '고양이';
            catImg.className = 'cat-img';
            catIcon.appendChild(catImg);
            
            const catName = document.createElement('div');
            catName.className = 'cat-name';
            catName.textContent = cat.name;
            
            const effectIcons = document.createElement('div');
            effectIcons.className = 'effect-icons';
            
            const statusElement = document.createElement('div');
            statusElement.className = 'cat-status running';
            statusElement.textContent = '[달림]';
            
            const energyBarContainer = document.createElement('div');
            energyBarContainer.className = 'energy-bar-container';
            
            const energyBar = document.createElement('div');
            energyBar.className = 'energy-bar';
            
            energyBarContainer.appendChild(energyBar);
            catElement.appendChild(statusElement);
            catElement.appendChild(effectIcons);
            catElement.appendChild(catIcon);
            catElement.appendChild(catName);
            catElement.appendChild(energyBarContainer);
            raceTrack.appendChild(catElement);
            
            cat.element = catElement;
            cat.energyBar = energyBar;
            cat.effectIcons = effectIcons;
            cat.statusElement = statusElement;
            
            cats.push(cat);
        }
        
        // 게임 모달 닫기
        setupModal.classList.add('hidden');
        
        // 로그 추가
        addLog(getRandomCommentary('start'));
        
        // 게임 루프 시작
        gameLoop();
        
        // 이벤트 타이머 시작
        startEventTimers();
    }

    // 게임 루프
    function gameLoop() {
        if (gameOver) return;
        
        // 모든 고양이 업데이트
        cats.forEach(updateCat);
        
        // 게임 종료 체크 - 모든 고양이가 결승선을 통과했거나, 한 마리만 남았을 때 종료
        const finishedCount = finishedCats.length;
        const totalCats = cats.length;
        
        if (finishedCount >= totalCats - 1 || cats.every(cat => cat.finished)) {
            endGame();
            return;
        }
        
        // 다음 프레임 요청
        requestAnimationFrame(gameLoop);
    }

    // 고양이 상태 업데이트 함수
    function updateCatStatus(cat) {
        let statusText = '[달림]';
        let statusClass = 'running';
        
        if (cat.isExhausted) {
            statusText = '[휴식]';
            statusClass = 'resting';
        } else if (cat.isLightningHit) {
            statusText = '[기절]';
            statusClass = 'stunned';
        } else if (cat.isCatMadness) {
            statusText = '[미침]';
            statusClass = 'madness';
        } else if (cat.isRainbowBoost) {
            statusText = '[강화]';
            statusClass = 'boosted';
        }
        
        cat.statusElement.textContent = statusText;
        cat.statusElement.className = `cat-status ${statusClass}`;
        
        // 상태에 따른 이미지 변경
        updateCatImage(cat);
    }

    // 고양이 상태에 따라 이미지 변경 함수
    function updateCatImage(cat) {
        const catImg = cat.element.querySelector('.cat-img');
        
        if (cat.isExhausted) {
            catImg.src = 'images/cats/cat-exhausted.png';
        } else if (cat.isLightningHit) {
            catImg.src = 'images/cats/cat-stunned.png';
        } else if (cat.isCatMadness) {
            catImg.src = 'images/cats/cat-madness.png';
        } else if (cat.isRainbowBoost) {
            catImg.src = 'images/cats/cat-boosted.png';
        } else {
            catImg.src = 'images/cats/cat-normal.png';
        }
    }

    // 이펙트 아이콘 추가 함수
    function addEffectIcon(cat, effect) {
        // 기존에 같은 이펙트 아이콘이 있으면 제거
        removeEffectIcon(cat, effect);
        
        // 새 이펙트 아이콘 추가
        const icon = document.createElement('div');
        icon.className = `effect-icon ${effect}-icon`;
        
        // 이모지 대신 이미지 사용
        const iconImg = document.createElement('img');
        
        switch(effect) {
            case 'exhausted':
                iconImg.src = 'images/icons/exhausted.png';
                break;
            case 'cat-madness':
                iconImg.src = 'images/icons/madness.png';
                break;
            case 'lightning-hit':
                iconImg.src = 'images/icons/lightning.png';
                break;
            case 'rainbow-boost':
                iconImg.src = 'images/icons/rainbow.png';
                break;
        }
        
        iconImg.alt = effect;
        iconImg.className = 'effect-img';
        icon.appendChild(iconImg);
        cat.effectIcons.appendChild(icon);
    }
    
    // 이펙트 아이콘 제거 함수
    function removeEffectIcon(randomCat, effect) {
        const icons = randomCat.effectIcons.querySelectorAll(`.${effect}-icon`);
        icons.forEach(icon => icon.remove());
    }

    // 고양이 업데이트 함수
    function updateCat(cat) {
        if (cat.finished) return;
        
        // 체력 소진 상태에서는 움직이지 않음
        if (cat.isExhausted) {
            return;
        }
        
        // 번개 맞은 상태에서는 움직이지 않음
        if (cat.isLightningHit) {
            return;
        }
        
        // 디바이스 타입 확인 (모바일/데스크톱)
        const isMobile = window.innerWidth <= 768;
        
        // 체력 감소 - 모바일에서는 더 천천히 감소
        const energyDecreaseRate = isMobile ? 0.5 : 0.8;
        cat.energy -= energyDecreaseRate;
        cat.energyBar.style.width = `${cat.energy}%`;
        
        // 체력 소진 시
        if (cat.energy <= 0) {
            if (cat.isCatMadness) {
                // 광묘병 상태에서 체력 소진 시 휴식 상태로 전환
                cat.isCatMadness = false;
                cat.isExhausted = true;
                cat.element.classList.remove('cat-madness');
                cat.element.classList.add('exhausted');
                removeEffectIcon(cat, 'cat-madness');
                addEffectIcon(cat, 'exhausted');
                updateCatStatus(cat);
                addLog(getRandomCommentary('exhausted', {name: cat.name}));
                
                // 1.5초 후 체력 회복 (더 빠르게)
                setTimeout(() => {
                    if (gameOver) return;
                    cat.energy = 100;
                    cat.energyBar.style.width = '100%';
                    cat.isExhausted = false;
                    cat.element.classList.remove('exhausted');
                    removeEffectIcon(cat, 'exhausted');
                    updateCatStatus(cat);
                    addLog(getRandomCommentary('recovered', {name: cat.name}));
                }, 1500);
            } else {
                cat.isExhausted = true;
                cat.element.classList.add('exhausted');
                addEffectIcon(cat, 'exhausted');
                updateCatStatus(cat);
                addLog(getRandomCommentary('exhausted', {name: cat.name}));
                
                // 1.5초 후 체력 회복 (더 빠르게)
                setTimeout(() => {
                    if (gameOver) return;
                    cat.energy = 100;
                    cat.energyBar.style.width = '100%';
                    cat.isExhausted = false;
                    cat.element.classList.remove('exhausted');
                    removeEffectIcon(cat, 'exhausted');
                    updateCatStatus(cat);
                    addLog(getRandomCommentary('recovered', {name: cat.name}));
                }, 1500);
            }
            return;
        }
        
        // 이동 속도 계산 (무지개 부스트 적용)
        let moveSpeed = cat.speed;
        
        // 디바이스에 따른 속도 조정
        if (isMobile) {
            // 모바일에서는 트랙 크기에 비례하게 속도 줄임
            const speedScale = Math.min(1, trackWidth / 1000);
            moveSpeed *= speedScale;
        }
        
        if (cat.isRainbowBoost) {
            moveSpeed *= 2;
        }
        
        // 광묘병 상태에서는 뒤로 이동
        if (cat.isCatMadness) {
            cat.position -= moveSpeed;
            if (cat.position < 0) cat.position = 0;
        } else {
            cat.position += moveSpeed;
        }
        
        // 위치 업데이트
        cat.element.style.left = `${cat.position}px`;
        
        // 수정: 결승선 통과 체크 - 고양이의 오른쪽 끝이 결승선을 넘어가야 함
        const catRightEdge = cat.position + cat.element.offsetWidth;
        const finishLinePos = trackWidth - finishLinePosition;
        
        // 고양이의 오른쪽 끝이 결승선을 통과했는지 확인
        if (catRightEdge >= finishLinePos && !cat.finished) {
            cat.finished = true;
            cat.rank = finishedCats.length + 1;
            cat.finishTime = raceTime;
            finishedCats.push(cat);
            
            // 랭킹 업데이트
            updateRanking();
            
            // 상태 숨기기
            cat.statusElement.style.display = 'none';
            
            addLog(getRandomCommentary('finish', {name: cat.name, rank: cat.rank, time: cat.finishTime.toFixed(2)}));
        }
    }
    
    // 이벤트 타이머 제거 함수
    function clearEventTimers() {
        for (const timer in eventTimers) {
            if (eventTimers[timer]) {
                clearInterval(eventTimers[timer]);
                eventTimers[timer] = null;
            }
        }
    }

    // 이벤트 타이머 시작
    function startEventTimers() {
        // 동적 이벤트 간격 (고양이가 완주할수록 짧아짐)
        function getEventInterval() {
            // 디바이스 타입 확인 (모바일/데스크톱)
            const isMobile = window.innerWidth <= 768;
            
            // 모바일에서는 기본 간격을 더 길게 설정
            const mobileScale = isMobile ? 1.5 : 1;
            
            // 완주한 고양이 수에 따라 간격 감소 (최소 1초, 최대 5초 또는 모바일의 경우 7.5초)
            const maxInterval = 5000 * mobileScale;
            const minInterval = isMobile ? 1500 : 1000;
            const decreaseFactor = isMobile ? 300 : 500;
            
            const baseInterval = Math.max(minInterval, maxInterval - (finishedCats.length * decreaseFactor));
            return baseInterval + Math.random() * (2000 * mobileScale);
        }
        
        // 이벤트 타이머 재설정 함수
        function resetEventTimers() {
            clearEventTimers();
            startEventTimers();
        }
        
        // 광묘병 발생 (동적 간격)
        eventTimers.catMadness = setInterval(() => {
            if (gameOver || !gameStarted) return;
            
            // 이벤트를 적용할 수 있는 고양이 필터링 (이미 효과 적용 중인 고양이 제외)
            const availableCats = cats.filter(cat => 
                !cat.finished && 
                !cat.isCatMadness && 
                !cat.isExhausted && 
                !cat.isLightningHit // 기절 상태인 경우 광묘병 적용 안됨
            );
            
            if (availableCats.length > 0) {
                // 각 고양이의 위치를 기준으로 정렬하여 1등 고양이 찾기
                const sortedCats = [...availableCats].sort((a, b) => b.position - a.position);
                const leadingCat = sortedCats[0];
                
                // 1등 고양이가 걸릴 확률 20% 증가
                const cats = availableCats.map(cat => {
                    // 1등 고양이의 가중치는 1.2, 나머지는 1
                    return {
                        cat: cat,
                        weight: (cat === leadingCat) ? 1.2 : 1
                    };
                });
                
                // 가중치 기반 랜덤 선택
                const totalWeight = cats.reduce((sum, item) => sum + item.weight, 0);
                let random = Math.random() * totalWeight;
                
                let selectedCat;
                for (const item of cats) {
                    random -= item.weight;
                    if (random <= 0) {
                        selectedCat = item.cat;
                        break;
                    }
                }
                
                // 선택된 고양이에게 이벤트 적용
                selectedCat.isCatMadness = true;
                selectedCat.element.classList.add('cat-madness');
                addEffectIcon(selectedCat, 'cat-madness');
                updateCatStatus(selectedCat);
                addLog(getRandomCommentary('catMadness', {name: selectedCat.name}));
                
                // 디바이스 타입 확인 (모바일/데스크톱)
                const isMobile = window.innerWidth <= 768;
                const effectDuration = isMobile ? 3000 : 2000; // 모바일에서는 3초
                
                // 광묘병 상태는 모바일에서는 3초, 데스크톱에서는 2초 동안 지속
                setTimeout(() => {
                    if (gameOver || selectedCat.finished || !selectedCat.isCatMadness) return;
                    
                    selectedCat.isCatMadness = false;
                    selectedCat.element.classList.remove('cat-madness');
                    removeEffectIcon(selectedCat, 'cat-madness');
                    updateCatStatus(selectedCat);
                    addLog(getRandomCommentary('catMadnessCured', {name: selectedCat.name}));
                }, effectDuration);
            }
        }, getEventInterval());
        
        // 번개 발생 (동적 간격)
        eventTimers.lightning = setInterval(() => {
            if (gameOver || !gameStarted) return;
            
            // 이벤트를 적용할 수 있는 고양이 필터링 (이미 효과 적용 중인 고양이 제외)
            const availableCats = cats.filter(cat => 
                !cat.finished && 
                !cat.isLightningHit &&
                !cat.isCatMadness // 광묘병 상태인 경우 번개 적용 안됨
            );
            
            if (availableCats.length > 0) {
                // 각 고양이의 위치를 기준으로 정렬하여 1등 고양이 찾기
                const sortedCats = [...availableCats].sort((a, b) => b.position - a.position);
                const leadingCat = sortedCats[0];
                
                // 1등 고양이가 걸릴 확률 20% 증가
                const cats = availableCats.map(cat => {
                    // 1등 고양이의 가중치는 1.2, 나머지는 1
                    return {
                        cat: cat,
                        weight: (cat === leadingCat) ? 1.2 : 1
                    };
                });
                
                // 가중치 기반 랜덤 선택
                const totalWeight = cats.reduce((sum, item) => sum + item.weight, 0);
                let random = Math.random() * totalWeight;
                
                let selectedCat;
                for (const item of cats) {
                    random -= item.weight;
                    if (random <= 0) {
                        selectedCat = item.cat;
                        break;
                    }
                }
                
                // 번개 이펙트 생성
                const lightning = document.createElement('div');
                lightning.className = 'lightning';
                lightning.style.left = `${selectedCat.position + 20}px`;
                lightning.style.top = `${selectedCat.top + 5}px`;
                raceTrack.appendChild(lightning);
                
                // 번개 효과 적용
                selectedCat.isLightningHit = true;
                selectedCat.element.classList.add('lightning-hit');
                addEffectIcon(selectedCat, 'lightning-hit');
                updateCatStatus(selectedCat);
                addLog(getRandomCommentary('lightning', {name: selectedCat.name}));
                
                // 번개 이펙트 제거
                setTimeout(() => {
                    if (lightning.parentNode === raceTrack) {
                        raceTrack.removeChild(lightning);
                    }
                }, 1000);
                
                // 3초 후 번개 효과 해제
                setTimeout(() => {
                    if (gameOver) return;
                    selectedCat.isLightningHit = false;
                    selectedCat.element.classList.remove('lightning-hit');
                    removeEffectIcon(selectedCat, 'lightning-hit');
                    updateCatStatus(selectedCat);
                    addLog(getRandomCommentary('lightningRecovered', {name: selectedCat.name}));
                }, 3000);
            }
        }, getEventInterval());
        
        // 무지개 발생 (동적 간격)
        eventTimers.rainbow = setInterval(() => {
            if (gameOver || !gameStarted) return;
            
            // 무지개는 모든 상태에 중첩 가능 (이미 무지개 효과가 적용된 고양이는 제외)
            const availableCats = cats.filter(cat => 
                !cat.finished && 
                !cat.isRainbowBoost
            );
            
            if (availableCats.length > 0) {
                const randomCat = availableCats[Math.floor(Math.random() * availableCats.length)];
                
                // 무지개 부스트 적용
                randomCat.isRainbowBoost = true;
                randomCat.element.classList.add('rainbow-boost');
                addEffectIcon(randomCat, 'rainbow-boost');
                updateCatStatus(randomCat);
                addLog(getRandomCommentary('rainbow', {name: randomCat.name}));
                
                // 2초 후 무지개 부스트 효과 종료 (더 오래 지속)
                setTimeout(() => {
                    if (gameOver) return;
                    randomCat.isRainbowBoost = false;
                    randomCat.element.classList.remove('rainbow-boost');
                    removeEffectIcon(randomCat, 'rainbow-boost');
                    updateCatStatus(randomCat);
                }, 2000);
            }
        }, getEventInterval());
        
        // 완주한 고양이가 생길 때마다 이벤트 간격 재설정
        const originalUpdateCat = updateCat;
        updateCat = function(cat) {
            const wasFinished = cat.finished;
            originalUpdateCat(cat);
            // 고양이가 새로 완주했을 때 이벤트 간격 재설정
            if (!wasFinished && cat.finished) {
                resetEventTimers();
            }
        };
    }

    // 로그 추가 함수
    function addLog(message) {
        const logEntry = document.createElement('p');
        logEntry.textContent = `[${raceTime.toFixed(2)}초] ${message}`;
        
        // 최신 로그를 가장 위에 추가
        if (raceLog.firstChild) {
            raceLog.insertBefore(logEntry, raceLog.firstChild);
        } else {
            raceLog.appendChild(logEntry);
        }
        
        // 스크롤을 최상단으로 이동
        raceLog.scrollTop = 0;
    }

    // 게임 종료 함수
    function endGame() {
        gameOver = true;
        gameStarted = false;
        
        // 타이머 중지
        clearInterval(timerInterval);
        
        // 이벤트 타이머 제거
        clearEventTimers();
        
        // 결과 모달 표시
        resultsList.innerHTML = '';
        
        // 최종 경주 결과 발표
        addLog(getRandomCommentary('allFinished'));
        
        finishedCats.forEach(cat => {
            const resultEntry = document.createElement('p');
            resultEntry.textContent = `${cat.rank}위: ${cat.name} (${cat.finishTime.toFixed(2)}초)`;
            resultsList.appendChild(resultEntry);
        });
        
        // 결승선에 도달하지 못한 고양이 표시 (옵션)
        const unfinishedCats = cats.filter(cat => !cat.finished);
        if (unfinishedCats.length > 0) {
            const unfinishedHeader = document.createElement('p');
            unfinishedHeader.textContent = '완주하지 못한 고양이:';
            unfinishedHeader.style.marginTop = '15px';
            resultsList.appendChild(unfinishedHeader);
            
            unfinishedCats.forEach(cat => {
                const unfinishedEntry = document.createElement('p');
                unfinishedEntry.textContent = `${cat.name}`;
                resultsList.appendChild(unfinishedEntry);
            });
        }
        
        resultsModal.classList.remove('hidden');
    }

    // 게임 리셋 함수
    function resetGame() {
        resultsModal.classList.add('hidden');
        setupModal.classList.remove('hidden');
        updateCatNameInputs();
    }

    // 초기 설정
    updateCatNameInputs();
}); 