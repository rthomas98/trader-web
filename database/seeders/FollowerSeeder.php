<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class FollowerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Make sure we have enough users
        if (User::count() < 5) {
            $this->command->info('Not enough users found. Please run UserSeeder first.');
            return;
        }

        // Get all users
        $users = User::all();
        
        // Create random follow relationships
        $followCount = 0;
        
        foreach ($users as $follower) {
            // Each user follows 1-5 random other users
            $followingCount = rand(1, 5);
            
            // Get random users to follow (excluding self)
            $potentialFollowees = $users->where('id', '!=', $follower->id)->random(min($followingCount, $users->count() - 1));
            
            foreach ($potentialFollowees as $followee) {
                // Check if already following
                if (!$follower->following()->where('following_id', $followee->id)->exists()) {
                    $follower->following()->attach($followee->id);
                    $followCount++;
                }
            }
        }
        
        // Create some popular users with more followers
        // Select 3 random users to be "popular"
        $popularUsers = $users->random(3);
        
        foreach ($popularUsers as $popularUser) {
            // Get users who aren't already following this popular user
            $potentialFollowers = $users->where('id', '!=', $popularUser->id)
                ->filter(function ($user) use ($popularUser) {
                    return !$user->following()->where('following_id', $popularUser->id)->exists();
                });
            
            // Make 40-60% of users follow the popular user
            $additionalFollowerCount = ceil($potentialFollowers->count() * (rand(40, 60) / 100));
            $newFollowers = $potentialFollowers->random(min($additionalFollowerCount, $potentialFollowers->count()));
            
            foreach ($newFollowers as $follower) {
                $follower->following()->attach($popularUser->id);
                $followCount++;
            }
        }
        
        $this->command->info("Created {$followCount} follow relationships successfully.");
    }
}
