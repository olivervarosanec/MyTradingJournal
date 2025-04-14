from flask import Blueprint, request, jsonify
from .models import Trade
from . import db
from datetime import datetime
import yfinance as yf
import pandas as pd

main_bp = Blueprint('main', __name__)

# Format for date parsing
DATE_FORMAT = '%Y-%m-%dT%H:%M:%S'

@main_bp.route('/api/trades', methods=['GET'])
def get_trades():
    trades = Trade.query.order_by(Trade.entry_date).all()
    return jsonify([trade.to_dict() for trade in trades])

@main_bp.route('/api/trades/<int:trade_id>', methods=['GET'])
def get_trade(trade_id):
    trade = Trade.query.get_or_404(trade_id)
    return jsonify(trade.to_dict())

@main_bp.route('/api/trades', methods=['POST'])
def create_trade():
    data = request.json
    
    # Parse dates from ISO format
    entry_date = datetime.fromisoformat(data['entry_date'].replace('Z', '+00:00'))
    exit_date = datetime.fromisoformat(data['exit_date'].replace('Z', '+00:00'))
    
    # Create new trade
    new_trade = Trade(
        ticker=data['ticker'],
        direction=data['direction'],
        volume=int(data['volume']),
        entry_price=float(data['entry_price']),
        stop_loss=float(data['stop_loss']),
        target_price=float(data['target_price']),
        entry_date=entry_date,
        exit_date=exit_date,
        exit_price=float(data['exit_price'])
    )
    
    # Calculate cumulative equity
    last_trade = Trade.query.order_by(Trade.id.desc()).first()
    if last_trade:
        new_trade.cumulative_equity = last_trade.cumulative_equity + new_trade.profit_loss
    else:
        # First trade starts with profit/loss
        new_trade.cumulative_equity = new_trade.profit_loss
    
    db.session.add(new_trade)
    db.session.commit()
    
    return jsonify(new_trade.to_dict()), 201

@main_bp.route('/api/trades/<int:trade_id>', methods=['PUT'])
def update_trade(trade_id):
    trade = Trade.query.get_or_404(trade_id)
    data = request.json
    
    # Update fields
    trade.ticker = data['ticker']
    trade.direction = data['direction']
    trade.volume = int(data['volume'])
    trade.entry_price = float(data['entry_price'])
    trade.stop_loss = float(data['stop_loss'])
    trade.target_price = float(data['target_price'])
    trade.entry_date = datetime.fromisoformat(data['entry_date'].replace('Z', '+00:00'))
    trade.exit_date = datetime.fromisoformat(data['exit_date'].replace('Z', '+00:00'))
    trade.exit_price = float(data['exit_price'])
    
    # Recalculate metrics
    trade.calculate_metrics()
    
    # Update all trades' cumulative equity that come after this one
    trades_after = Trade.query.filter(Trade.id > trade.id).order_by(Trade.id).all()
    
    # Get previous cumulative equity
    prev_trade = Trade.query.filter(Trade.id < trade.id).order_by(Trade.id.desc()).first()
    if prev_trade:
        trade.cumulative_equity = prev_trade.cumulative_equity + trade.profit_loss
    else:
        trade.cumulative_equity = trade.profit_loss
        
    # Update subsequent trades
    current_equity = trade.cumulative_equity
    for t in trades_after:
        current_equity += t.profit_loss
        t.cumulative_equity = current_equity
    
    db.session.commit()
    
    return jsonify(trade.to_dict())

@main_bp.route('/api/trades/<int:trade_id>', methods=['DELETE'])
def delete_trade(trade_id):
    trade = Trade.query.get_or_404(trade_id)
    
    # Get trades after this one to update their cumulative equity
    trades_after = Trade.query.filter(Trade.id > trade.id).order_by(Trade.id).all()
    
    # Delete the trade
    db.session.delete(trade)
    db.session.commit()
    
    # Update cumulative equity for subsequent trades
    if trades_after:
        # Get previous trade to current deletion
        prev_trade = Trade.query.filter(Trade.id < trade_id).order_by(Trade.id.desc()).first()
        current_equity = prev_trade.cumulative_equity if prev_trade else 0
        
        for t in trades_after:
            current_equity += t.profit_loss
            t.cumulative_equity = current_equity
            
        db.session.commit()
    
    return jsonify({"message": "Trade deleted"})

@main_bp.route('/api/stats', methods=['GET'])
def get_stats():
    trades = Trade.query.all()
    
    if not trades:
        return jsonify({
            "total_trades": 0,
            "win_rate": 0,
            "avg_profit_loss": 0,
            "avg_risk_reward": 0,
            "max_drawdown": 0,
            "total_profit_loss": 0,
            "avg_holding_period": 0,
            "monthly_performance": [],
            "best_trade": None,
            "worst_trade": None
        })
    
    # Calculate statistics
    total_trades = len(trades)
    profitable_trades = sum(1 for trade in trades if trade.profit_loss > 0)
    win_rate = profitable_trades / total_trades if total_trades > 0 else 0
    
    avg_profit_loss = sum(trade.profit_loss for trade in trades) / total_trades if total_trades > 0 else 0
    avg_risk_reward = sum(trade.risk_reward for trade in trades) / total_trades if total_trades > 0 else 0
    
    # Calculate drawdown
    equity_values = []
    current_equity = 0
    for trade in trades:
        current_equity += trade.profit_loss
        equity_values.append(current_equity)
    
    # Calculate max drawdown
    max_drawdown = 0
    peak = 0
    
    for equity in equity_values:
        if equity > peak:
            peak = equity
        drawdown = peak - equity
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    
    total_profit_loss = sum(trade.profit_loss for trade in trades)
    avg_holding_period = sum(trade.days_held for trade in trades) / total_trades if total_trades > 0 else 0
    
    # Monthly performance
    monthly_perf = {}
    for trade in trades:
        month_key = trade.exit_date.strftime('%Y-%m')
        if month_key not in monthly_perf:
            monthly_perf[month_key] = 0
        monthly_perf[month_key] += trade.profit_loss
    
    monthly_performance = [{"month": k, "profit_loss": v} for k, v in monthly_perf.items()]
    
    # Best and worst trades
    best_trade = max(trades, key=lambda x: x.profit_loss)
    worst_trade = min(trades, key=lambda x: x.profit_loss)
    
    return jsonify({
        "total_trades": total_trades,
        "win_rate": win_rate,
        "avg_profit_loss": avg_profit_loss,
        "avg_risk_reward": avg_risk_reward,
        "max_drawdown": max_drawdown,
        "total_profit_loss": total_profit_loss,
        "avg_holding_period": avg_holding_period,
        "monthly_performance": monthly_performance,
        "best_trade": best_trade.to_dict(),
        "worst_trade": worst_trade.to_dict()
    })

@main_bp.route('/api/charts/<string:ticker>', methods=['GET'])
def get_stock_chart(ticker):
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    
    # Download data from Yahoo Finance
    try:
        data = yf.download(ticker, start=start_date, end=end_date)
        if data.empty:
            return jsonify({"error": "No data available for this ticker"}), 404
            
        # Convert to dictionary format for JSON response
        data_dict = data.reset_index().to_dict(orient='records')
        return jsonify(data_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500 