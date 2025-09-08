"""
Performance optimization utilities for faster API responses
"""

import functools
import time
from typing import Any, Callable, Dict
from datetime import datetime, timedelta

# Simple in-memory cache
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5 minutes

def cache_result(ttl: int = CACHE_TTL):
    """
    Decorator to cache function results for specified TTL (time to live) in seconds
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(sorted(kwargs.items()))}"
            
            # Check if result is in cache and still valid
            if cache_key in _cache:
                cached_data = _cache[cache_key]
                if time.time() - cached_data['timestamp'] < ttl:
                    print(f"Cache HIT for {func.__name__}")
                    return cached_data['result']
                else:
                    # Remove expired cache entry
                    del _cache[cache_key]
            
            # Execute function and cache result
            print(f"Cache MISS for {func.__name__} - executing")
            result = func(*args, **kwargs)
            _cache[cache_key] = {
                'result': result,
                'timestamp': time.time()
            }
            
            return result
        return wrapper
    return decorator

def clear_cache():
    """Clear all cached results"""
    global _cache
    _cache.clear()
    print("Cache cleared")

def get_cache_stats():
    """Get cache statistics"""
    return {
        'total_entries': len(_cache),
        'cache_keys': list(_cache.keys()),
        'memory_usage_estimate': sum(len(str(v)) for v in _cache.values())
    }

# Pagination utility
class Paginator:
    def __init__(self, query, page: int = 1, per_page: int = 50):
        self.query = query
        self.page = max(1, page)
        self.per_page = min(100, max(1, per_page))  # Limit max per_page to 100
        
    def paginate(self):
        total = self.query.count()
        items = self.query.offset((self.page - 1) * self.per_page).limit(self.per_page).all()
        
        return {
            'items': items,
            'total': total,
            'page': self.page,
            'per_page': self.per_page,
            'pages': (total + self.per_page - 1) // self.per_page,
            'has_prev': self.page > 1,
            'has_next': self.page * self.per_page < total
        }

# Performance monitoring
def timing_decorator(func: Callable) -> Callable:
    """Decorator to measure function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        execution_time = end_time - start_time
        
        print(f"⏱️ {func.__name__} executed in {execution_time:.3f} seconds")
        
        # Log slow queries (> 1 second)
        if execution_time > 1.0:
            print(f"🐌 SLOW QUERY WARNING: {func.__name__} took {execution_time:.3f} seconds")
            
        return result
    return wrapper

# Database optimization helpers
def optimize_database_indexes():
    """
    SQL commands to create indexes for better performance
    These should be run on the database
    """
    return [
        "CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);", 
        "CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);",
        "CREATE INDEX IF NOT EXISTS idx_sales_is_settled ON sales(is_settled);",
        "CREATE INDEX IF NOT EXISTS idx_recharge_customer_id ON recharge_transactions(customer_id);",
        "CREATE INDEX IF NOT EXISTS idx_recharge_date ON recharge_transactions(recharge_date);",
        "CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);",
        "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);",
        "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
    ]

# Response compression and optimization
class ResponseOptimizer:
    @staticmethod
    def compress_sales_data(sales_list):
        """Optimize sales data for faster transmission"""
        return [
            {
                'id': sale.id,
                'total': sale.total_price,
                'method': sale.payment_method,
                'settled': sale.is_settled,
                'time': sale.timestamp.isoformat() if sale.timestamp else None,
                'customer': sale.customer_id,
                'items': len(sale.items) if sale.items else 0
            }
            for sale in sales_list
        ]
    
    @staticmethod
    def compress_product_data(products_list):
        """Optimize product data for faster transmission"""
        return [
            {
                'id': product.id,
                'name': product.name,
                'price': product.price,
                'stock': product.stock,
                'category': product.category_id
            }
            for product in products_list
        ]