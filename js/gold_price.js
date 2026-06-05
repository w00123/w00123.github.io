// 金价数据卡片逻辑 - 透明磨砂框显示
(function() {
    const API_URL = 'https://tmini.net/api/gold-price?type=json';
    const CACHE_DURATION = 5 * 60 * 1000;
    const CACHE_KEY = 'gold_price_cache';

    // 指定要显示的 metals 名称
    const METALS_FILTER = ['今日金价', '黄金_9999'];
    
    // 指定要显示的 stores 品牌
    const STORES_FILTER = ['黄金价格', '周大福', '老凤祥', '六福珠宝', '周六福', '中国黄金'];
    
    // 指定要显示的 banks 银行
    const BANKS_FILTER = ['中国银行','建设银行','招商银行','工商银行','农业银行','民生银行'];

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
        if (!data) {
            html = '<div class="gold-empty">暂无金价数据~</div>';
        } else {
            const date = data.date || '未知时间';
            html += `<div class="gold-date">${date}</div>`;
            
            // 显示 metals 数据（详细格式）
            if (data.metals && data.metals.length > 0) {
                data.metals.forEach((metal) => {
                    if (METALS_FILTER.includes(metal.name)) {
                        html += `
                            <div class="gold-card">
                                <div class="gold-name">${metal.name || '未知品种'}</div>
                                <div class="gold-item">当前卖出价：<span class="gold-value">${metal.sell_price || '-'}元/克</span></div>
                                <div class="gold-item">今日开盘价：<span class="gold-value">${metal.today_price || '-'}元/克</span></div>
                                <div class="gold-item">今日最高价：<span class="gold-value">${metal.high_price || '-'}元/克</span></div>
                                <div class="gold-item">今日最低价：<span class="gold-value">${metal.low_price || '-'}元/克</span></div>
                            </div>
                        `;
                    }
                });
            }
            
            // 显示 stores 数据（简洁格式）
            if (data.stores && data.stores.length > 0) {
                html += `<div class="gold-card">`;
                html += `<div class="gold-name">品牌金价</div>`;
                data.stores.forEach((store) => {
                    if (STORES_FILTER.includes(store.brand)) {
                        html += `<div class="gold-item">${store.brand}：<span class="gold-value">${store.price || '-'}元/克</span></div>`;
                    }
                });
                html += `</div>`;
            }
            
            // 显示 banks 数据（简洁格式）
            if (data.banks && data.banks.length > 0) {
                html += `<div class="gold-card">`;
                html += `<div class="gold-name">银行金价</div>`;
                data.banks.forEach((bank) => {
                    if (BANKS_FILTER.includes(bank.bank)) {
                        html += `<div class="gold-item">${bank.bank}-${bank.name || '投资金条'}：<span class="gold-value">${bank.price || '-'}元/克</span></div>`;
                    }
                });
                html += `</div>`;
            }
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