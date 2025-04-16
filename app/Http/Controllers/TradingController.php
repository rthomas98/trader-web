<?php

namespace App\Http\Controllers;

use App\Models\TradingOrder;
use App\Models\TradingPosition;
use App\Models\TradingWallet;
use App\Models\User;
use App\Models\Wallet;
use App\Services\MarketDataService;
use App\Services\TradingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\StoreTradingOrderRequest;

class TradingController extends Controller
{
    protected $tradingService;
    protected $marketDataService;
    
    /**
     * Create a new controller instance.
     */
    public function __construct(TradingService $tradingService, MarketDataService $marketDataService)
    {
        $this->tradingService = $tradingService;
        $this->marketDataService = $marketDataService;
    }
    
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();
        
        // Get or create the active trading wallet based on the user's mode
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        
        // Get positions for the active wallet
        $positions = $tradingWallet->tradingPositions()
            ->where('status', 'OPEN')
            ->get();
            
        // Get orders for the active wallet
        $orders = $tradingWallet->tradingOrders()
            ->whereIn('status', ['PENDING', 'PARTIALLY_FILLED'])
            ->get();
        
        // Fetch Pending Orders
        $pendingOrders = TradingOrder::where('user_id', $user->id)
                                     ->where('status', 'PENDING') 
                                     ->orderBy('created_at', 'desc')
                                     ->get();

        // Get market overview data
        $marketOverview = $this->tradingService->getMarketOverviewData();
        
        // Get available currency pairs
        $availablePairs = $this->tradingService->getAvailableCurrencyPairs();
        
        return Inertia::render('trading/index', [
            'positions' => $positions,
            'orders' => $orders,
            'account' => [
                'balance' => $tradingWallet->balance,
                'available_margin' => $tradingWallet->available_margin,
                'leverage' => $tradingWallet->leverage,
                'risk_percentage' => $tradingWallet->risk_percentage,
                'mode' => $user->demo_mode_enabled ? 'DEMO' : 'LIVE',
            ],
            'marketOverview' => $marketOverview,
            'availablePairs' => $availablePairs,
            'pendingOrders' => $pendingOrders, 
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $availablePairs = $this->tradingService->getAvailableCurrencyPairs();
        
        return Inertia::render('trading/create', [
            'account' => [
                'balance' => $tradingWallet->balance,
                'available_margin' => $tradingWallet->available_margin,
                'leverage' => $tradingWallet->leverage,
                'risk_percentage' => $tradingWallet->risk_percentage,
                'mode' => $user->demo_mode_enabled ? 'DEMO' : 'LIVE',
            ],
            'availablePairs' => $availablePairs,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        
        $validated = $request->validate([
            'currency_pair' => 'required|string|max:20',
            'order_type' => 'required|in:MARKET,LIMIT,STOP,STOP_LIMIT',
            'side' => 'required|in:BUY,SELL',
            'quantity' => 'required|numeric|min:0.00000001',
            'price' => 'required_unless:order_type,MARKET|nullable|numeric|min:0',
            'stop_loss' => 'nullable|numeric|min:0',
            'take_profit' => 'nullable|numeric|min:0',
            'time_in_force' => 'required|in:GTC,IOC,FOK,DAY',
        ]);

        try {
            // For market orders, execute immediately
            if ($validated['order_type'] === 'MARKET') {
                $result = $this->tradingService->processMarketOrder($tradingWallet, $validated);
                
                return redirect()->route('trading.index')
                    ->with('success', 'Market order executed successfully.');
            } else {
                // Create order
                $order = TradingOrder::create([
                    'user_id' => $user->id,
                    'trading_wallet_id' => $tradingWallet->id,
                    'currency_pair' => $validated['currency_pair'],
                    'order_type' => $validated['order_type'],
                    'side' => $validated['side'],
                    'quantity' => $validated['quantity'],
                    'price' => $validated['price'],
                    'stop_loss' => $validated['stop_loss'],
                    'take_profit' => $validated['take_profit'],
                    'time_in_force' => $validated['time_in_force'],
                    'status' => 'PENDING',
                ]);
                
                return redirect()->route('trading.index')
                    ->with('success', 'Order created successfully.');
            }
        } catch (\Exception $e) {
            return redirect()->back()
                ->withInput()
                ->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Store a newly created trading order in storage.
     */
    public function storeOrder(StoreTradingOrderRequest $request): RedirectResponse
    {
        $validatedData = $request->validated();
        $user = Auth::user();

        // Determine initial status
        // For now, all submitted orders become PENDING.
        // A separate process/service would handle MARKET execution or monitor LIMIT prices.
        $status = 'PENDING'; 

        // Create the TradingOrder record
        TradingOrder::create([
            'user_id' => $user->id,
            'trading_wallet_id' => $validatedData['trading_wallet_id'],
            'currency_pair' => $validatedData['currency_pair'],
            'order_type' => $validatedData['order_type'],
            'side' => $validatedData['side'],
            'quantity' => $validatedData['quantity'],
            'price' => $validatedData['entry_price'], // Use 'price' field for limit price (null for market)
            'stop_loss' => $validatedData['stop_loss'],
            'take_profit' => $validatedData['take_profit'],
            'status' => $status,
            // 'time_in_force' => $validatedData['time_in_force'] ?? 'GTC', // Example if added later
        ]);

        // TODO: Trigger asynchronous job/event for market order execution
        // if ($validatedData['order_type'] === 'MARKET') {
        //     ProcessMarketOrder::dispatch($order->id);
        // }

        // TODO: Trigger monitoring for LIMIT orders if needed (or handle via scheduled task)

        return Redirect::route('trading.index')->with('success', 'Trading order placed successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $position = $tradingWallet->tradingPositions()->findOrFail($id);
        $currentPrice = $this->marketDataService->getCurrentPrice($position->currency_pair);
        $symbolDetails = $this->marketDataService->getSymbolDetails($position->currency_pair);
        
        // Calculate current profit/loss
        $profitLoss = $this->marketDataService->calculateProfitLoss(
            $position->trade_type,
            $position->entry_price,
            $currentPrice,
            $position->quantity
        );
        
        $position->current_price = $currentPrice;
        $position->current_profit_loss = $profitLoss;
        $position->current_profit_loss_percentage = ($profitLoss / ($position->entry_price * $position->quantity)) * 100;
        
        return Inertia::render('trading/show', [
            'position' => $position,
            'symbolDetails' => $symbolDetails,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $order = $tradingWallet->tradingOrders()->findOrFail($id);
        $currentPrice = $this->marketDataService->getCurrentPrice($order->currency_pair);
        
        return Inertia::render('trading/edit', [
            'order' => $order,
            'currentPrice' => $currentPrice,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $order = $tradingWallet->tradingOrders()->findOrFail($id);
        
        // Only allow updating pending orders
        if ($order->status !== 'PENDING') {
            return redirect()->route('trading.index')
                ->with('error', 'Only pending orders can be updated.');
        }
        
        $validated = $request->validate([
            'price' => 'required_unless:order_type,MARKET|nullable|numeric|min:0',
            'stop_loss' => 'nullable|numeric|min:0',
            'take_profit' => 'nullable|numeric|min:0',
        ]);

        $order->update($validated);

        return redirect()->route('trading.index')
            ->with('success', 'Order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $order = $tradingWallet->tradingOrders()->findOrFail($id);
        
        // Only allow canceling pending orders
        if ($order->status !== 'PENDING') {
            return redirect()->route('trading.index')
                ->with('error', 'Only pending orders can be canceled.');
        }
        
        $order->status = 'CANCELED';
        $order->save();

        return redirect()->route('trading.index')
            ->with('success', 'Order canceled successfully.');
    }

    /**
     * Close a trading position.
     */
    public function closePosition(Request $request, string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $position = $tradingWallet->tradingPositions()->findOrFail($id);
        
        // Check if position is already closed
        if ($position->status !== 'OPEN') {
            return redirect()->route('trading.index')
                ->with('error', 'Position is already closed.');
        }
        
        try {
            $result = $this->tradingService->closePosition($tradingWallet, $position);
            
            return redirect()->route('trading.index')
                ->with('success', 'Position closed successfully. Profit/Loss: ' . number_format($result['profit_loss'], 2));
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to close position: ' . $e->getMessage());
        }
    }

    /**
     * Get chart data for a currency pair.
     */
    public function getChartData(Request $request)
    {
        $validated = $request->validate([
            'currency_pair' => 'required|string|max:20',
            'timeframe' => 'required|in:1m,5m,15m,30m,1h,4h,1d,1w',
            'limit' => 'nullable|integer|min:1|max:1000',
            'predictive_mode' => 'nullable|boolean',
        ]);

        $data = $this->tradingService->getChartData(
            $validated['currency_pair'],
            $validated['timeframe'],
            $validated['limit'] ?? 100,
            $validated['predictive_mode'] ?? false
        );

        return response()->json($data);
    }
    
    /**
     * Get current price for a currency pair.
     */
    public function getCurrentPrice(Request $request)
    {
        // If a specific currency pair is provided, return just that price
        if ($request->has('currency_pair')) {
            $validated = $request->validate([
                'currency_pair' => 'required|string|max:20',
            ]);
            
            $price = $this->marketDataService->getCurrentPrice($validated['currency_pair']);
            
            return response()->json([
                'currency_pair' => $validated['currency_pair'],
                'price' => $price,
                'timestamp' => now()->timestamp,
            ]);
        }
        
        // If no currency pair is specified, return prices for all available pairs
        $availablePairs = $this->tradingService->getAvailableCurrencyPairs();
        $prices = [];
        
        // Get prices for forex pairs
        foreach ($availablePairs['forex'] as $pair) {
            $prices[$pair] = $this->marketDataService->getCurrentPrice($pair);
        }
        
        // Get prices for crypto pairs
        foreach ($availablePairs['crypto'] as $pair) {
            $prices[$pair] = $this->marketDataService->getCurrentPrice($pair);
        }
        
        // Get prices for other pairs if available
        if (isset($availablePairs['commodities'])) {
            foreach ($availablePairs['commodities'] as $pair) {
                $prices[$pair] = $this->marketDataService->getCurrentPrice($pair);
            }
        }
        
        if (isset($availablePairs['indices'])) {
            foreach ($availablePairs['indices'] as $pair) {
                $prices[$pair] = $this->marketDataService->getCurrentPrice($pair);
            }
        }
        
        return response()->json([
            'prices' => $prices,
            'timestamp' => now()->timestamp,
        ]);
    }
    
    /**
     * Get symbol details.
     */
    public function getSymbolDetails(Request $request)
    {
        $validated = $request->validate([
            'symbol' => 'required|string|max:20',
        ]);
        
        $details = $this->marketDataService->getSymbolDetails($validated['symbol']);
        
        return response()->json($details);
    }

    /**
     * Get user's trading orders.
     */
    public function getOrders(Request $request)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $status = $request->input('status', 'PENDING');
        
        if (!is_array($status)) {
            $status = [$status];
        }
        
        $orders = $tradingWallet->tradingOrders()
            ->whereIn('status', $status)
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($orders);
    }
    
    /**
     * Create a new trading order.
     */
    public function createOrder(Request $request)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        
        $validated = $request->validate([
            'currency_pair' => 'required|string|max:20',
            'order_type' => 'required|in:MARKET,LIMIT,STOP,STOP_LIMIT',
            'side' => 'required|in:BUY,SELL',
            'quantity' => 'required|numeric|min:0.00000001',
            'price' => 'required_unless:order_type,MARKET|nullable|numeric|min:0',
            'stop_loss' => 'nullable|numeric|min:0',
            'take_profit' => 'nullable|numeric|min:0',
            'time_in_force' => 'required|in:GTC,IOC,FOK,DAY',
        ]);

        try {
            // For market orders, execute immediately
            if ($validated['order_type'] === 'MARKET') {
                $result = $this->tradingService->processMarketOrder($tradingWallet, $validated);
                
                return response()->json([
                    'message' => 'Market order executed successfully',
                    'position' => $result['position'] ?? null,
                    'order' => $result['order'] ?? null
                ], 201);
            } else {
                // Create order
                $order = TradingOrder::create([
                    'user_id' => $user->id,
                    'trading_wallet_id' => $tradingWallet->id,
                    'currency_pair' => $validated['currency_pair'],
                    'order_type' => $validated['order_type'],
                    'side' => $validated['side'],
                    'quantity' => $validated['quantity'],
                    'price' => $validated['price'],
                    'stop_loss' => $validated['stop_loss'],
                    'take_profit' => $validated['take_profit'],
                    'time_in_force' => $validated['time_in_force'],
                    'status' => 'PENDING',
                ]);
                
                return response()->json([
                    'message' => 'Order created successfully',
                    'order' => $order
                ], 201);
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 422);
        }
    }
    
    /**
     * Update an existing trading order.
     */
    public function updateOrder(Request $request, string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $order = $tradingWallet->tradingOrders()->findOrFail($id);
        
        // Only allow updating pending orders
        if ($order->status !== 'PENDING') {
            return response()->json([
                'message' => 'Only pending orders can be updated'
            ], 422);
        }
        
        $validated = $request->validate([
            'price' => 'nullable|numeric|min:0',
            'stop_loss' => 'nullable|numeric|min:0',
            'take_profit' => 'nullable|numeric|min:0',
            'quantity' => 'nullable|numeric|min:0.00000001',
        ]);

        $order->update($validated);

        return response()->json([
            'message' => 'Order updated successfully',
            'order' => $order
        ]);
    }
    
    /**
     * Cancel a trading order.
     */
    public function cancelOrder(string $id)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        $order = $tradingWallet->tradingOrders()->findOrFail($id);
        
        // Only allow canceling pending orders
        if ($order->status !== 'PENDING') {
            return response()->json([
                'message' => 'Only pending orders can be canceled'
            ], 422);
        }
        
        $order->status = 'CANCELLED';
        $order->save();

        return response()->json([
            'message' => 'Order canceled successfully',
            'order' => $order
        ]);
    }
    
    /**
     * Create a new trading position.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storePosition(Request $request)
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);
        
        $validated = $request->validate([
            'currency_pair' => 'required|string|max:20',
            'trade_type' => 'required|in:BUY,SELL',
            'quantity' => 'required|numeric|min:0.00000001',
            'stop_loss' => 'nullable|numeric|min:0',
            'take_profit' => 'nullable|numeric|min:0',
        ]);

        try {
            // Get current market price for the currency pair
            $currentPrice = $this->tradingService->getCurrentPrice($validated['currency_pair']);
            
            if (!$currentPrice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Could not get current price for the selected currency pair.',
                ], 400);
            }
            
            // Create a new position
            $position = new TradingPosition();
            $position->user_id = $user->id;
            $position->trading_wallet_id = $tradingWallet->id;
            $position->currency_pair = $validated['currency_pair'];
            $position->trade_type = $validated['trade_type'];
            $position->quantity = $validated['quantity'];
            $position->entry_price = $currentPrice;
            $position->entry_time = now(); // Add the entry_time field with current timestamp
            $position->stop_loss = $validated['stop_loss'];
            $position->take_profit = $validated['take_profit'];
            $position->status = 'OPEN';
            $position->save();
            
            // Update wallet balance and margin
            // In a real system, you'd calculate these values based on leverage, etc.
            // For demo purposes, we'll just update the used margin
            $tradingWallet->used_margin += ($validated['quantity'] * $currentPrice);
            $tradingWallet->available_margin = $tradingWallet->balance - $tradingWallet->used_margin;
            $tradingWallet->save();
            
            return redirect()->route('trading.index')->with('success', 'Position created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to create position: ' . $e->getMessage());
        }
    }
    
    /**
     * Toggle between demo and live trading modes.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleTradingMode()
    {
        $user = auth()->user();
        
        // Toggle the demo mode
        $user->demo_mode_enabled = !$user->demo_mode_enabled;
        $user->save();
        
        // Get both wallets
        $demoWallet = $this->getOrCreateTradingWallet($user, true);
        $liveWallet = $this->getOrCreateTradingWallet($user, false);
        
        // Update wallet active states based on the new mode
        if ($user->demo_mode_enabled) {
            // Activate demo wallet, deactivate live wallet
            $demoWallet->is_active = true;
            $liveWallet->is_active = false;
        } else {
            // Activate live wallet, deactivate demo wallet
            $demoWallet->is_active = false;
            $liveWallet->is_active = true;
        }
        
        $demoWallet->save();
        $liveWallet->save();
        
        // Get the active wallet based on the new mode
        $activeWallet = $user->demo_mode_enabled ? $demoWallet : $liveWallet;
        
        return response()->json([
            'success' => true,
            'message' => 'Trading mode toggled successfully',
            'demo_mode_enabled' => $user->demo_mode_enabled,
            'account' => [
                'mode' => $user->demo_mode_enabled ? 'DEMO' : 'LIVE',
                'balance' => $activeWallet->balance,
                'available_margin' => $activeWallet->available_margin,
                'used_margin' => $activeWallet->used_margin,
                'equity' => $activeWallet->equity,
                'leverage' => $activeWallet->leverage,
            ],
        ]);
    }
    
    /**
     * Migrate existing trading positions and orders to associate them with trading wallets.
     * This is a one-time operation to ensure backward compatibility.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function migrateExistingData()
    {
        $user = auth()->user();
        
        // Get or create the user's trading wallets
        $demoWallet = $this->getOrCreateTradingWallet($user, true);
        $liveWallet = $this->getOrCreateTradingWallet($user, false);
        
        // Update all existing positions without a trading_wallet_id
        $positions = TradingPosition::where('user_id', $user->id)
            ->whereNull('trading_wallet_id')
            ->get();
            
        foreach ($positions as $position) {
            // Assign to demo wallet by default (can be changed by admin if needed)
            $position->trading_wallet_id = $demoWallet->id;
            $position->save();
        }
        
        // Update all existing orders without a trading_wallet_id
        $orders = TradingOrder::where('user_id', $user->id)
            ->whereNull('trading_wallet_id')
            ->get();
            
        foreach ($orders as $order) {
            // Assign to demo wallet by default (can be changed by admin if needed)
            $order->trading_wallet_id = $demoWallet->id;
            $order->save();
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Existing trading data has been migrated successfully.',
            'positions_migrated' => $positions->count(),
            'orders_migrated' => $orders->count()
        ]);
    }
    
    /**
     * Get or create a trading wallet for the user based on their current mode.
     */
    protected function getOrCreateTradingWallet(User $user, $demoMode = null)
    {
        if ($demoMode === null) {
            $type = $user->demo_mode_enabled ? 'DEMO' : 'LIVE';
        } else {
            $type = $demoMode ? 'DEMO' : 'LIVE';
        }
        
        // First try to find an existing wallet
        $tradingWallet = $user->tradingWallets()
            ->where('wallet_type', $type)
            ->first();
            
        // If wallet exists, return it
        if ($tradingWallet) {
            return $tradingWallet;
        }
        
        // Create a new wallet if it doesn't exist
        $defaultValues = [
            'balance' => 0,
            'available_margin' => 0,
            'used_margin' => 0,
            'equity' => 0,
            'leverage' => 50,
            'margin_call_level' => 80,
            'margin_stop_out_level' => 50,
            'risk_percentage' => 2.00,
        ];
        
        // Set demo account with starting funds
        if ($type === 'DEMO') {
            $defaultValues['balance'] = 50000;
            $defaultValues['available_margin'] = 50000;
            $defaultValues['equity'] = 50000;
            $defaultValues['is_active'] = true;
        } else {
            // Live accounts start with zero balance and are inactive by default
            $defaultValues['is_active'] = false;
        }
        
        return $user->tradingWallets()->create([
            'wallet_type' => $type,
            'balance' => $defaultValues['balance'],
            'available_margin' => $defaultValues['available_margin'],
            'used_margin' => $defaultValues['used_margin'],
            'equity' => $defaultValues['equity'],
            'leverage' => $defaultValues['leverage'],
            'margin_call_level' => $defaultValues['margin_call_level'],
            'margin_stop_out_level' => $defaultValues['margin_stop_out_level'],
            'risk_percentage' => $defaultValues['risk_percentage'],
            'is_active' => $defaultValues['is_active'],
        ]);
    }

    /**
     * Display the trade history page.
     */
    public function history(): Response
    {
        $user = Auth::user();
        $tradingWallet = $this->getOrCreateTradingWallet($user);

        $closedPositions = $tradingWallet->tradingPositions()
            ->where('status', 'CLOSED')
            ->orderBy('closed_at', 'desc') // Show most recent closed trades first
            ->get();

        return Inertia::render('Trading/History', [
            'closedPositions' => $closedPositions,
        ]);
    }
}
