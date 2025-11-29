# Eru Internet Speed Test

A modern, responsive internet speed test web application built with vanilla JavaScript, HTML5, and Tailwind CSS. Test your download speed, upload speed, and ping with a beautiful, animated interface.

## Features

- **Real-time Speed Testing**: Accurate measurement of download, upload speeds and ping
- **Modern UI**: Glass morphism design with smooth animations and gradients
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Live Progress**: Real-time progress indicators and current speed display
- **Connection Info**: Displays IP address, ISP, server location, and jitter
- **No Dependencies**: Pure vanilla JavaScript - no build tools required

## Demo

Visit the deployed site to see the speed test in action.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for testing

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/eru-internet-speed-test.git
cd eru-internet-speed-test
```

2. Open `index.html` in your web browser:
```bash
# Simply open the file in your browser
open index.html
```

Or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

## Deployment to Vercel

### Method 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Method 2: Using GitHub Integration

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Connect your GitHub repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

### Method 3: Manual Upload

1. Compress the project files
2. Upload to Vercel dashboard manually

## Project Structure

```
eru-internet-speed-test/
├── index.html          # Main HTML file
├── script.js           # Speed test logic and UI interactions
├── styles.css          # Custom styles and animations
├── README.md           # This file
└── vercel.json         # Vercel configuration (optional)
```

## How It Works

### Speed Test Algorithm

1. **Ping Test**: Measures latency by making multiple HTTP requests and calculating average response time
2. **Download Test**: Downloads data chunks in parallel and calculates speed based on bytes received over time
3. **Upload Test**: Uploads data chunks and calculates speed based on bytes sent over time

### Technical Details

- Uses `httpbin.org` endpoints for consistent testing
- Implements parallel requests for accurate speed measurement
- Calculates jitter (ping variance) for connection stability
- Real-time progress updates during tests
- Responsive design with mobile-first approach

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 60+     | ✅ Full |
| Firefox | 55+     | ✅ Full |
| Safari  | 11+     | ✅ Full |
| Edge    | 79+     | ✅ Full |

## Customization

### Changing Test Servers

Edit the `script.js` file to modify the test endpoints:

```javascript
// Change these URLs in the respective test methods
const downloadUrls = [
    'https://your-server.com/file1.bin',
    'https://your-server.com/file2.bin'
];
const uploadUrl = 'https://your-server.com/upload';
```

### Modifying UI Colors

Edit the `styles.css` file or modify the Tailwind classes in `index.html` to change the color scheme.

### Adjusting Test Duration

In `script.js`, modify these variables:

```javascript
const testDuration = 8000; // Download test duration in milliseconds
const uploadTestDuration = 6000; // Upload test duration in milliseconds
```

## Performance Considerations

- Tests use multiple parallel connections for accuracy
- Large file chunks ensure stable measurements
- Progress updates are throttled to prevent UI lag
- All animations use GPU acceleration for smooth performance

## Security Notes

- No user data is stored or transmitted
- All requests are made to public testing endpoints
- No cookies or local storage usage
- HTTPS-only for secure connections

## Troubleshooting

### Common Issues

1. **Slow or inaccurate results**: Check your internet connection stability
2. **Tests failing**: Ensure CORS is enabled and test endpoints are accessible
3. **UI not loading**: Check browser console for JavaScript errors
4. **Mobile issues**: Ensure responsive viewport is set correctly

### Debug Mode

Enable debug logging by adding to `script.js`:

```javascript
const DEBUG = true;
// Then add console.log statements throughout the code
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS framework
- [httpbin.org](https://httpbin.org/) for testing endpoints
- Glass morphism design inspiration from modern UI trends

## Support

If you encounter any issues or have questions, please:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Made with ❤️ for fast internet everywhere**
