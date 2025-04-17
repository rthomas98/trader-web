<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\JournalEntry;
use App\Models\User;

class JournalEntrySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find the first user or create one if none exist
        $user = User::first();
        if (!$user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                // Add other necessary fields if User factory doesn't cover them
            ]);
        }

        JournalEntry::factory()->count(25)->create([
            'user_id' => $user->id,
        ]);
    }
}
