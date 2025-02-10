const axios = require('axios');
const Chart = require('chart.js');
const fs = require('fs');

// GraphQL query to fetch issue data for the project and milestone
const query = `
  query($owner: String!, $repo: String!, $milestone: Int!) {
    repository(owner: $owner, name: $repo) {
      issues(milestone: $milestone, states: OPEN) {
        edges {
          node {
            createdAt
            state
          }
        }
      }
    }
  }
`;

// GitHub project info
const owner = 'your-username'; // Replace with your username
const repo = 'your-repo'; // Replace with your repository name
const milestone = 1; // Replace with your milestone number

// Fetch data from GitHub GraphQL API
async function fetchIssueData() {
  const response = await axios.post(
    'https://api.github.com/graphql',
    {
      query,
      variables: {
        owner,
        repo,
        milestone,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    }
  );
  return response.data.data.repository.issues.edges;
}

// Generate the burndown chart
async function generateBurndownChart() {
  const issues = await fetchIssueData();

  // Count issues over time (e.g., how many open issues each day)
  const dailyCounts = {};

  issues.forEach((issue) => {
    const date = new Date(issue.node.createdAt).toLocaleDateString();
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  const dates = Object.keys(dailyCounts);
  const issueCounts = dates.map((date) => dailyCounts[date]);

  // Prepare the Chart.js chart data
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: 'Open Issues',
        data: issueCounts,
        borderColor: '#0366d6', // GitHub's blue color
        backgroundColor: 'rgba(3, 102, 214, 0.2)', // Light blue background
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Burndown Chart',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
  };

  // Generate chart
  const canvas = new Chart.Canvas();
  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: chartOptions,
  });

  // Save chart as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./burndown_chart.png', buffer);
  console.log('Burndown chart saved to burndown_chart.png');
}

// Run the script
generateBurndownChart();
