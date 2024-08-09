const puppeteer = require('puppeteer');
const cron = require('node-cron');

// Función para obtener y mostrar el valor del ICL
async function fetchICLData() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('https://www.bcra.gob.ar/PublicacionesEstadisticas/Principales_variables.asp', {
            waitUntil: 'networkidle2'
        });

        const iclData = await page.evaluate(() => {
            const iclElement = document.querySelector('a[href="/PublicacionesEstadisticas/Principales_variables_datos.asp?serie=7988&detalle=Índice para Contratos de Locación (ICL-Ley 27.551, con dos decimales, base 30.6.20=1)"]');
            if (iclElement) {
                const row = iclElement.closest('tr');
                const fecha = row.querySelector('td:nth-of-type(2)').innerText.trim();
                const valor = row.querySelector('td:nth-of-type(3)').innerText.trim();
                return { fecha, valor };
            }
            return null;
        });

        if (iclData) {
            console.log('Fecha:', iclData.fecha);
            console.log('Valor del ICL:', iclData.valor);
        } else {
            console.log('No se encontraron datos del ICL');
        }

        await browser.close();
    } catch (error) {
        console.error('Error al obtener datos del ICL:', error);
    }
}

// Programar cron job para ejecutar cada minuto
cron.schedule('* * * * *', () => {
    console.log('Ejecutando cron job cada minuto...');
    fetchICLData();
});
