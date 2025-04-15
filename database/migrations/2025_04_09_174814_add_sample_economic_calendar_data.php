<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add sample economic calendar data
        DB::table('economic_calendars')->insert([
            [
                'event_id' => 'ec-' . Str::uuid(),
                'title' => 'Federal Reserve Interest Rate Decision',
                'country' => 'US',
                'event_date' => now()->format('Y-m-d'),
                'event_time' => '14:00',
                'impact' => 'high',
                'forecast' => '5.25%',
                'previous' => '5.25%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_id' => 'ec-' . Str::uuid(),
                'title' => 'Non-Farm Payrolls',
                'country' => 'US',
                'event_date' => now()->addDays(1)->format('Y-m-d'),
                'event_time' => '08:30',
                'impact' => 'high',
                'forecast' => '175K',
                'previous' => '187K',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_id' => 'ec-' . Str::uuid(),
                'title' => 'GDP Growth Rate QoQ',
                'country' => 'US',
                'event_date' => now()->addDays(2)->format('Y-m-d'),
                'event_time' => '08:30',
                'impact' => 'high',
                'forecast' => '2.1%',
                'previous' => '2.0%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_id' => 'ec-' . Str::uuid(),
                'title' => 'ECB Interest Rate Decision',
                'country' => 'EU',
                'event_date' => now()->addDays(3)->format('Y-m-d'),
                'event_time' => '07:45',
                'impact' => 'high',
                'forecast' => '4.5%',
                'previous' => '4.5%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_id' => 'ec-' . Str::uuid(),
                'title' => 'Consumer Price Index YoY',
                'country' => 'US',
                'event_date' => now()->addDays(4)->format('Y-m-d'),
                'event_time' => '08:30',
                'impact' => 'high',
                'forecast' => '3.4%',
                'previous' => '3.5%',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove sample data
        DB::table('economic_calendars')->truncate();
    }
};
