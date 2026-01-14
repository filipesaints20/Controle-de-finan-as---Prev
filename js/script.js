const API = "https://script.google.com/macros/s/AKfycbyZx3ejW-ndTZ28TnZcfI2YgrS7_WLK5F2aiiJycELiQBUlt3d8BUJgpVSaltWJhEhJ/exec";

const App = {
    data: { despesas: [] },
    chart: null,

    async init() {
        try {
            const res = await fetch(API, { redirect: 'follow' });
            const json = await res.json();
            // Como seus dados já vêm calculados da planilha (saldo/valor_pago), simplificamos
            this.data.despesas = json.despesas || [];
            this.render();
        } catch (e) {
            alert("Erro ao carregar dados. Verifique a URL da API.");
        }
    },

    render() {
        // Cálculos baseados no JSON que você enviou
        const tBruto = this.data.despesas.reduce((acc, d) => acc + (Number(d.valor_total) || 0), 0);
        const tPago = this.data.despesas.reduce((acc, d) => acc + (Number(d.valor_pago) || 0), 0);
        const tPend = tBruto - tPago;
        
        document.getElementById("bruto").innerText = this.fmt(tBruto);
        document.getElementById("pago").innerText = this.fmt(tPago);
        document.getElementById("pend").innerText = this.fmt(tPend);

        this.renderTabelas();
        this.renderChart(tPago, tPend);
    },

    renderTabelas() {
        const pList = document.getElementById("lista-pagar");
        const hList = document.getElementById("lista-historico");
        pList.innerHTML = ""; hList.innerHTML = "";

        this.data.despesas.forEach(d => {
            const total = Number(d.valor_total) || 0;
            const pago = Number(d.valor_pago) || 0;
            const saldo = total - pago;

            // Mostrar na lista de contas se ainda houver saldo (ignora itens de valor 0)
            if (saldo > 0.01 && total > 0) {
                pList.innerHTML += `
                    <tr>
                        <td><strong>${d.descricao}</strong></td>
                        <td>${this.fmt(total)}</td>
                        <td><span class="badge badge-pending">${this.fmt(saldo)}</span></td>
                        <td><button class="btn-pay" onclick="App.pay('${d.id}', '${d.descricao}')">PAGAR</button></td>
                    </tr>`;
            }

            // Adicionar ao histórico se já houve algum pagamento
            if (pago > 0) {
                hList.innerHTML += `
                    <tr>
                        <td>${d.criado_em || '---'}</td>
                        <td>${d.descricao}</td>
                        <td style="color:var(--success); font-weight:700">${this.fmt(pago)}</td>
                        <td><span class="badge badge-success">${d.status}</span></td>
                    </tr>`;
            }
        });
    },

    async pay(id, nome) {
        const v = prompt(`Valor do pagamento para ${nome}:`);
        if(!v) return;
        document.body.style.opacity = "0.5";
        await fetch(API, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ tipo: "pagamento", id_despesa: id, valor: v.replace(',','.') }) 
        });
        alert("Enviado! Atualizando...");
        setTimeout(() => { document.body.style.opacity = "1"; this.init(); }, 2000);
    },

    renderChart(pago, pend) {
        const ctx = document.getElementById("chart").getContext("2d");
        if(this.chart) this.chart.destroy();
        this.chart = new Chart(ctx, {
            type: 'doughnut',
            data: { 
                labels: ['Pago', 'Pendente'], 
                datasets: [{ data: [pago, pend], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }] 
            },
            options: { cutout: '80%', plugins: { legend: { position: 'bottom' } } }
        });
    },

    fmt(v) { return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
};

function Route(id, el) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
}

window.onload = () => App.init();