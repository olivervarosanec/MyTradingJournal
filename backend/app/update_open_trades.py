from app import create_app, db
from app.models import Trade

app = create_app()
with app.app_context():
    open_trades = Trade.query.filter((Trade.exit_date == None) | (Trade.exit_price == None)).all()
    for trade in open_trades:
        trade.calculate_metrics()
    db.session.commit()
    print(f"Updated {len(open_trades)} open trades with recalculated days_held.") 