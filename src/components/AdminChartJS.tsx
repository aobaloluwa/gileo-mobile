import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type AdminChartJSProps = {
  type?: 'line' | 'bar';
  labels?: string[];
  dataPoints?: number[];
  chartTitle?: string;
};

export function AdminChartJS({
  type = 'line',
  labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  dataPoints = [45000, 68000, 92000, 58000, 120000, 84000, 105000],
  chartTitle = 'Revenue (₦)',
}: AdminChartJSProps) {
  const chartHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; padding: 4px; }
    .chart-container { position: relative; width: 100%; height: 210px; }
  </style>
</head>
<body>
  <div class="chart-container">
    <canvas id="adminChart"></canvas>
  </div>
  <script>
    const ctx = document.getElementById('adminChart').getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 190);
    gradient.addColorStop(0, 'rgba(241, 5, 5, 0.35)');
    gradient.addColorStop(1, 'rgba(241, 5, 5, 0.01)');

    new Chart(ctx, {
      type: '${type}',
      data: {
        labels: ${JSON.stringify(labels)},
        datasets: [{
          label: '${chartTitle}',
          data: ${JSON.stringify(dataPoints)},
          borderColor: '#F10505',
          borderWidth: 3,
          backgroundColor: ${type === 'line' ? 'gradient' : "'#3F0106'"},
          borderRadius: ${type === 'bar' ? 8 : 0},
          fill: ${type === 'line' ? 'true' : 'false'},
          tension: 0.4,
          pointBackgroundColor: '#3F0106',
          pointBorderColor: '#FFFFFF',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            titleColor: '#FFFFFF',
            bodyColor: '#FDF2F2',
            padding: 10,
            cornerRadius: 12,
            callbacks: {
              label: function(context) { return '${chartTitle}: ₦' + Number(context.parsed.y || 0).toLocaleString(); }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748B', font: { weight: '600', size: 11 } } },
          y: { grid: { color: '#F1F5F9' }, ticks: { color: '#64748B', font: { size: 10 }, callback: function(v) { return '₦' + (v >= 1000 ? (v/1000) + 'k' : v); } } }
        }
      }
    });
  </script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: chartHtml }}
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
