<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Services\TradingStatsService;

class SocialController extends Controller
{
    /**
     * Display the social trading dashboard.
     */
    public function index(): InertiaResponse
    {
        $currentUser = Auth::user();
        $currentUserId = $currentUser->id; // Get current user's ID

        // Get IDs of users the current user is following
        $followingIds = $currentUser->following()->pluck('users.id')->toArray(); // Get an array of IDs

        // Get followers and following counts for the current user
        $followersCount = $currentUser->followers()->count();
        $followingCount = count($followingIds); // Use the count from the plucked IDs

        // Get recent followers (limit to 5)
        $recentFollowers = $currentUser->followers()
            ->latest('follows.created_at')
            ->take(5)
            ->get(['id', 'name', 'email']);

        // Get popular traders (users with most followers)
        $popularTraders = User::withCount('followers')
            ->where('id', '!=', $currentUserId) // Exclude the current user
            ->orderBy('followers_count', 'desc')
            ->take(5)
            ->get(['id', 'name', 'email', 'followers_count']); // Ensure followers_count is selected

        // Add follow status and self-check to popular traders
        $popularTraders = $popularTraders->map(function ($trader) use ($followingIds, $currentUserId) {
            $trader->is_following = in_array($trader->id, $followingIds);
            // is_current_user will always be false here now, but good practice
            $trader->is_current_user = ($trader->id === $currentUserId); 
            return $trader;
        });

        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
        ];

        return Inertia::render('SocialTrading/Index', [
            'breadcrumbs' => $breadcrumbs,
            'stats' => [
                'followers' => $followersCount,
                'following' => $followingCount,
            ],
            'recentFollowers' => $recentFollowers,
            'popularTraders' => $popularTraders,
        ]);
    }

    /**
     * Display the followers list.
     */
    public function followers(Request $request): InertiaResponse
    {
        $user = Auth::user();

        // Get the user's followers with pagination
        $followers = $user->followers()
            ->withCount('followers')
            ->withCount('following')
            ->paginate(10);

        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
            ['name' => 'My Followers', 'href' => route('social.followers')],
        ];

        return Inertia::render('SocialTrading/Followers', [
            'breadcrumbs' => $breadcrumbs,
            'followers' => $followers,
        ]);
    }

    /**
     * Display the following list.
     */
    public function following(Request $request): InertiaResponse
    {
        $user = Auth::user();

        // Get the users that the current user is following with pagination
        $following = $user->following()
            ->withCount('followers')
            ->withCount('following')
            ->paginate(10);

        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
            ['name' => 'Following', 'href' => route('social.following')],
        ];

        return Inertia::render('SocialTrading/Following', [
            'breadcrumbs' => $breadcrumbs,
            'following' => $following,
        ]);
    }

    /**
     * Display a specific trader's profile.
     */
    public function showTrader(Request $request, User $user, TradingStatsService $tradingStatsService): InertiaResponse
    {
        $currentUser = Auth::user();

        // Check if the current user is following this trader
        $isFollowing = $currentUser->following()->where('following_id', $user->id)->exists();

        // Get trader's stats
        $traderStats = [
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
            // You can add more stats here like performance metrics, win rate, etc.
        ];

        // Get performance chart data
        $performanceChartData = $tradingStatsService->getPerformanceChartData($user);

        // Get trader's strategies
        $strategies = $user->strategies()->orderBy('created_at', 'desc')->get(['id', 'name', 'description']);

        // Set up breadcrumbs
        $breadcrumbs = [
            ['name' => 'Dashboard', 'href' => route('dashboard')],
            ['name' => 'Social Trading', 'href' => route('social.index')],
            ['name' => $user->name, 'href' => route('social.trader', $user->id)],
        ];

        return Inertia::render('SocialTrading/TraderProfile', [
            'breadcrumbs' => $breadcrumbs,
            'trader' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'stats' => $traderStats,
                'performanceChartData' => $performanceChartData,
                'strategies' => $strategies, // Pass strategies
            ],
            'isFollowing' => $isFollowing,
        ]);
    }

    /**
     * Follow a trader.
     */
    public function follow(User $user): JsonResponse
    {
        $currentUser = Auth::user();

        // Prevent users from following themselves
        if ($currentUser->id === $user->id) {
            return response()->json([
                'message' => 'You cannot follow yourself',
            ], 400);
        }

        // Check if already following
        if ($currentUser->following()->where('following_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'You are already following this trader',
            ], 400);
        }

        // Add the follow relationship
        $currentUser->following()->attach($user->id);

        return response()->json([
            'message' => 'You are now following ' . $user->name,
        ]);
    }

    /**
     * Unfollow a trader.
     */
    public function unfollow(User $user): JsonResponse
    {
        $currentUser = Auth::user();

        // Remove the follow relationship
        $currentUser->following()->detach($user->id);

        return response()->json([
            'message' => 'You have unfollowed ' . $user->name,
        ]);
    }

    /**
     * Search for traders.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('query');

        $traders = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->withCount('followers')
            ->orderBy('followers_count', 'desc')
            ->take(10)
            ->get(['id', 'name', 'email']);

        return response()->json([
            'traders' => $traders,
        ]);
    }

    /**
     * Get popular traders.
     */
    public function popularTraders(): JsonResponse
    {
        $traders = User::withCount('followers')
            ->orderBy('followers_count', 'desc')
            ->take(10)
            ->get(['id', 'name', 'email']);

        return response()->json([
            'traders' => $traders,
        ]);
    }
}
