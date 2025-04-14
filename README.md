# Trading Journal Application

A comprehensive web-based application for traders to record, track, and analyze their trades efficiently. Built with a Python Flask backend and React frontend, using an SQLite database for local storage.

## Features

- **Trade Entry**: Record your trades with all necessary details (ticker, direction, volume, prices, dates, etc.)
- **Automatic Calculations**: Profit/loss, risk-reward ratio, holding period, and other metrics calculated automatically
- **Dashboard**: Visualize performance with equity curve, win rate, and other statistics
- **Trade History**: View, search, sort, and analyze all past trades
- **Trade Details**: View detailed analysis of any trade including price charts with entry/exit points
- **Dark Mode UI**: Professional and visually appealing dark theme interface

## Project Structure

The project is divided into two main parts:

- `backend/`: Flask API backend with SQLite database
- `frontend/`: React frontend with Material UI

## Setup and Installation

### Backend

1. Navigate to the backend directory:
```
cd backend
```

2. Install required packages:
```
pip install -r requirements.txt
```

3. Run the Flask application:
```
python app.py
```

The backend will start on http://localhost:5000.

### Frontend

1. Navigate to the frontend directory:
```
cd frontend
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm start
```

The frontend will be available at http://localhost:3000.

## Usage

1. **Adding Trades**: Navigate to the "Add Trade" page to enter new trades.
2. **Viewing Dashboard**: The dashboard provides an overview of your trading performance.
3. **Trade History**: View all trades, filter by ticker, and sort by various metrics.
4. **Trade Details**: Click on any trade in the history to see detailed information and a price chart.

## License

This project is open-source and available under the MIT License. 