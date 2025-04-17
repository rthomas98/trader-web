<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPerformanceMilestones extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-performance-milestones';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check user performance milestones and send notifications if conditions are met';

    /**
     * Execute the console command.
     */
    public function handle(NotificationService $notificationService)
    {
        $this->info('Checking performance milestones...');
        
        // Get all users with at least one trade
        $users = User::whereHas('trades')->get();
            
        if ($users->isEmpty()) {
            $this->info('No users with trades found.');
            return;
        }
        
        $this->info('Found ' . $users->count() . ' users with trades.');
        
        // Check each user
        foreach ($users as $user) {
            try {
                $this->info("Checking performance milestones for user {$user->id}");
                
                // Check performance milestones for this user
                $notificationService->checkPerformanceMilestones($user);
            } catch (\Exception $e) {
                $this->error("Error checking performance milestones for user {$user->id}: " . $e->getMessage());
                Log::error("Error checking performance milestones for user {$user->id}", [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }
        
        $this->info('Performance milestone check completed.');
    }
}
