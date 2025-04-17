<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class FollowFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // This factory doesn't create users, but rather establishes follow relationships
        // between existing users. The actual creation happens in the seeder.
        return [];
    }

    /**
     * Create a follow relationship between two users.
     *
     * @param int $followerId The ID of the user who is following
     * @param int $followingId The ID of the user being followed
     * @return void
     */
    public function createFollow(int $followerId, int $followingId): void
    {
        // Prevent users from following themselves
        if ($followerId === $followingId) {
            return;
        }

        // Get the users
        $follower = User::find($followerId);
        $following = User::find($followingId);

        if (!$follower || !$following) {
            return;
        }

        // Check if the follow relationship already exists
        if ($follower->following()->where('following_id', $followingId)->exists()) {
            return;
        }

        // Create the follow relationship
        $follower->following()->attach($followingId, [
            'created_at' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'updated_at' => now(),
        ]);
    }
}
