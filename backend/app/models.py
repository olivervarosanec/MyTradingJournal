from . import db
from datetime import datetime
from sqlalchemy.sql import func

class Trade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(10), nullable=False)
    direction = db.Column(db.String(5), nullable=False)  # 'Buy' or 'Short'
    volume = db.Column(db.Integer, nullable=False)
    entry_price = db.Column(db.Float, nullable=False)
    stop_loss = db.Column(db.Float, nullable=True)
    target_price = db.Column(db.Float, nullable=True)
    entry_date = db.Column(db.DateTime, nullable=False)
    exit_date = db.Column(db.DateTime, nullable=True)
    exit_price = db.Column(db.Float, nullable=True)
    
    # Calculated fields
    risk_reward = db.Column(db.Float)
    days_held = db.Column(db.Float)
    capital_invested = db.Column(db.Float)
    profit_loss = db.Column(db.Float)
    risk_per_share = db.Column(db.Float)
    profit_per_share = db.Column(db.Float)
    risk_dollars = db.Column(db.Float)
    profit_dollars = db.Column(db.Float)
    profit_factor = db.Column(db.Float)
    cumulative_equity = db.Column(db.Float)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=func.now())
    updated_at = db.Column(db.DateTime, default=func.now(), onupdate=func.now())
    
    def __init__(self, ticker, direction, volume, entry_price, entry_date, 
                 stop_loss=None, target_price=None, exit_date=None, exit_price=None):
        self.ticker = ticker
        self.direction = direction
        self.volume = volume
        self.entry_price = entry_price
        self.stop_loss = stop_loss
        self.target_price = target_price
        self.entry_date = entry_date
        self.exit_date = exit_date
        self.exit_price = exit_price
        
        # Calculate metrics
        self.calculate_metrics()
    
    def calculate_metrics(self):
        def _make_naive(dt):
            if dt is not None and hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt

        if self.exit_date is not None and self.exit_price is not None:
            entry_date_naive = _make_naive(self.entry_date)
            exit_date_naive = _make_naive(self.exit_date)
            time_diff = exit_date_naive - entry_date_naive
            self.days_held = time_diff.total_seconds() / (24 * 3600)
            
            # Calculate capital invested
            self.capital_invested = self.volume * self.entry_price
            
            # Calculate risk per share if stop_loss is provided
            if self.stop_loss is not None:
                if self.direction == 'Buy':
                    self.risk_per_share = self.entry_price - self.stop_loss
                    self.profit_per_share = self.exit_price - self.entry_price
                    self.risk_dollars = self.risk_per_share * self.volume
                    self.profit_dollars = self.profit_per_share * self.volume
                else:  # Short
                    self.risk_per_share = self.stop_loss - self.entry_price
                    self.profit_per_share = self.entry_price - self.exit_price
                    self.risk_dollars = self.risk_per_share * self.volume
                    self.profit_dollars = self.profit_per_share * self.volume
                
                # Calculate risk in dollars
                self.risk_dollars = abs(self.risk_per_share * self.volume)
            else:
                self.risk_per_share = None
                self.risk_dollars = None
                self.profit_per_share = self.exit_price - self.entry_price if self.direction == 'Buy' else self.entry_price - self.exit_price
                self.profit_dollars = self.profit_per_share * self.volume
            
            # Calculate profit/loss
            self.profit_loss = self.profit_per_share * self.volume
            
            # Calculate profit factor and risk/reward only if both stop_loss and target_price are provided
            if self.stop_loss is not None and self.target_price is not None:
                potential_reward = abs(self.target_price - self.entry_price)
                potential_risk = abs(self.stop_loss - self.entry_price)
                if potential_risk != 0:
                    self.profit_factor = potential_reward / potential_risk
                    self.risk_reward = potential_reward / potential_risk
                else:
                    self.profit_factor = 0
                    self.risk_reward = 0
            else:
                self.profit_factor = None
                self.risk_reward = None
            
        else:
            # For open trades, use now as the exit date
            now = datetime.now()
            entry_date_naive = _make_naive(self.entry_date)
            now_naive = _make_naive(now)
            time_diff = now_naive - entry_date_naive
            self.days_held = time_diff.total_seconds() / (24 * 3600)
            self.capital_invested = self.volume * self.entry_price
            
            # Only calculate these if stop_loss is provided
            if self.stop_loss is not None:
                if self.direction == 'Buy':
                    self.risk_per_share = self.entry_price - self.stop_loss
                else:
                    self.risk_per_share = self.stop_loss - self.entry_price
                    
                # Calculate risk in dollars for open trades
                self.risk_dollars = abs(self.risk_per_share * self.volume)
            else:
                self.risk_per_share = None
                self.risk_dollars = None
            
            self.profit_per_share = None
            self.profit_loss = None
            self.profit_dollars = None
            
            # Calculate profit factor for open trades only if both stop_loss and target_price are provided
            if self.stop_loss is not None and self.target_price is not None:
                potential_reward = abs(self.target_price - self.entry_price)
                potential_risk = abs(self.stop_loss - self.entry_price)
                if potential_risk != 0:
                    self.profit_factor = potential_reward / potential_risk
                    self.risk_reward = potential_reward / potential_risk
                else:
                    self.profit_factor = 0
                    self.risk_reward = 0
            else:
                self.profit_factor = None
                self.risk_reward = None
            
    def to_dict(self):
        return {
            'id': self.id,
            'ticker': self.ticker,
            'direction': self.direction,
            'volume': self.volume,
            'entry_price': self.entry_price,
            'stop_loss': self.stop_loss,
            'target_price': self.target_price,
            'entry_date': self.entry_date.isoformat() if self.entry_date else None,
            'exit_date': self.exit_date.isoformat() if self.exit_date else None,
            'exit_price': self.exit_price,
            'risk_reward': self.risk_reward,
            'days_held': self.days_held,
            'capital_invested': self.capital_invested,
            'profit_loss': self.profit_loss,
            'risk_per_share': self.risk_per_share,
            'profit_per_share': self.profit_per_share,
            'risk_dollars': self.risk_dollars,
            'profit_dollars': self.profit_dollars,
            'profit_factor': self.profit_factor,
            'cumulative_equity': self.cumulative_equity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 