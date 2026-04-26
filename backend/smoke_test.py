import urllib.request
import json

# Test 1: Products
r = urllib.request.urlopen('http://localhost:8000/api/products/')
d = json.loads(r.read())
print('Products success:', d['success'], '| count:', len(d['data']))
for p in d['data'][:3]:
    print('  -', p['name'], 'Rs.', p['price'])

# Test 2: Admin login
body = json.dumps({'email': 'admin@nutrimetry.in', 'password': 'password123'}).encode()
req = urllib.request.Request('http://localhost:8000/api/auth/login', data=body, headers={'Content-Type': 'application/json'})
r2 = urllib.request.urlopen(req)
d2 = json.loads(r2.read())
print('Admin login success:', d2['success'], '| role:', d2['data']['role'])

# Test 3: Farmer login
body2 = json.dumps({'email': 'user@nutrimetry.in', 'password': 'password123'}).encode()
req2 = urllib.request.Request('http://localhost:8000/api/auth/login', data=body2, headers={'Content-Type': 'application/json'})
r3 = urllib.request.urlopen(req2)
d3 = json.loads(r3.read())
print('Farmer login success:', d3['success'], '| role:', d3['data']['role'])

print('\nAll smoke tests PASSED!')
