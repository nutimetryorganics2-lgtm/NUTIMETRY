from app.main import app
from starlette.routing import Route, Mount

def print_routes(routes, prefix=""):
    for route in routes:
        if isinstance(route, Route):
            print(f"{prefix}{route.path} {route.methods}")
        elif isinstance(route, Mount):
            print(f"{prefix}{route.path} [MOUNT]")
            print_routes(route.routes, prefix + route.path)

print_routes(app.routes)
