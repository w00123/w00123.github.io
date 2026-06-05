// 金价数据卡片逻辑 - 透明磨砂框显示
(function() {
    const API_URL = 'https://tmini.net/api/gold-price?type=json';
    const CACHE_DURATION = 5 * 60 * 1000;
    const CACHE_KEY = 'gold_price_cache';

    function goldPrice() {
        let html = '';
        let data = JSON.parse(localStorage.getItem(CACHE_KEY));
        let nowTime = Date.now();

        if (data == null || nowTime - data.timestamp > CACHE_DURATION) {
            getData();
            return;
        } else {
            renderGoldPrice(data.data);
            return;
        }
    }

    function renderGoldPrice(data) {
        let html = '';
        if (!data || !data.metals || data.metals.length === 0) {
            html = '<div class="gold-empty">暂无金价数据~</div>';
        } else {
            const date = data.date || '未知时间';
            html += `<div class="gold-date">${date}</div>`;
            
            data.metals.forEach((metal, index) => {
                html += `
                    <div class="gold-card">
                        <div class="gold-name">${metal.name || '未知品种'}</div>
                        <div class="gold-item">当前卖出价：<span class="gold-value">${metal.sell_price || '-'}</span></div>
                        <div class="gold-item">今日开盘价：<span class="gold-value">${metal.today_price || '-'}</span></div>
                        <div class="gold-item">今日最高价：<span class="gold-value">${metal.high_price || '-'}</span></div>
                    </div>
                `;
            });
        }
        document.getElementById('gold_price_content').innerHTML = html;
    }

    function getData() {
        fetch(API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) throw new Error(`状态码: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const cacheData = {
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            renderGoldPrice(data);
        })
        .catch(error => {
            console.error('获取金价数据失败:', error);
            document.getElementById('gold_price_content').innerHTML = '<div class="gold-empty">暂无金价数据~</div>';
        });
    }

    try {
        if (document.getElementById('gold_price').clientWidth) goldPrice();
    } catch (error) {
        goldPrice();
    }
})();
