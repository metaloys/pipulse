'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { StatsCard } from '@/components/stats-card';
import { TaskCard } from '@/components/task-card';
import { Leaderboard } from '@/components/leaderboard';
import { TaskSubmissionModal } from '@/components/task-submission-modal';
import { EmployerDashboard } from '@/components/employer-dashboard';
import { CreateTaskModal } from '@/components/create-task-modal';
import { Button } from '@/components/ui/button';
import { usePiAuth } from '@/contexts/pi-auth-context';
import type { UserRole, TaskCategory, DatabaseTask, LeaderboardEntry, UserStats, Task } from '@/lib/types';
import { 
  Coins, 
  CheckCircle, 
  Target, 
  TrendingUp,
  Briefcase,
  Plus,
} from 'lucide-react';

// Empty real stats (not mock) - shows 0 values while loading
const EMPTY_STATS: UserStats = {
  dailyEarnings: 0,
  weeklyEarnings: 0,
  totalEarnings: 0,
  tasksCompleted: 0,
  currentStreak: 0,
  level: 'Newcomer',
  availableTasksCount: 0,
};

export default function HomePage() {
  const { userData, user } = usePiAuth();
  
  // Get userRole from tRPC user object if available, otherwise default to 'worker'
  const [userRole, setUserRole] = useState<UserRole>((user?.userRole as UserRole) || 'worker');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [tasks, setTasks] = useState<DatabaseTask[]>([]);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [employerTasks, setEmployerTasks] = useState<DatabaseTask[]>([]);
  
  // Initialize userStats from tRPC user object
  const [userStats, setUserStats] = useState<UserStats>({
    dailyEarnings: 0,
    weeklyEarnings: 0,
    totalEarnings: user?.totalEarnings || 0,
    tasksCompleted: user?.totalTasksCompleted || 0,
    currentStreak: user?.currentStreak || 0,
    level: user?.level || 'NEWCOMER',
    availableTasksCount: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<DatabaseTask | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  // Load user's current role from database
  useEffect(() => {
    const loadUserRole = async () => {
      // If we have the full user object from tRPC, use it directly
      if (user?.id && user?.userRole) {
        console.log('📋 User role from tRPC context:', user.userRole);
        setUserRole(user.userRole as UserRole);
        return;
      }
      
      // Fallback for old flow (if needed)
      if (userData?.id) {
        try {
          const fetchedUser = await getUserById(userData.id);
          if (fetchedUser) {
            console.log('📋 User role from database:', fetchedUser.user_role);
            setUserRole(fetchedUser.user_role);
          }
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      }
    };
    loadUserRole();
  }, [user, userData?.id]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real tasks from API
        const tasksResponse = await fetch('/api/tasks/list');
        const tasksData = await tasksResponse.json();
        
        // Filter out user's own tasks when in worker mode
        let availableTasks = tasksData.tasks || [];
        if (userRole === 'worker' && user?.id) {
          availableTasks = availableTasks.filter((task: any) => task.employerId !== user.id);
          console.log(`📋 Filtered tasks: ${tasksData.tasks?.length} total, ${availableTasks.length} available for worker (excluded ${(tasksData.tasks?.length || 0) - availableTasks.length} own tasks)`);
        }
        
        setTasks(availableTasks);
        
        // Fetch real leaderboard from API
        try {
          const leaderboardResponse = await fetch('/api/leaderboard');
          const leaderboardData = await leaderboardResponse.json();
          const entries = leaderboardData.leaderboard || [];
          const formattedLeaderboard = entries.map((entry: any, index: number) => ({
            rank: index + 1,
            username: entry.piUsername,
            earnings: entry.totalEarnings,
            tasksCompleted: entry.totalTasksCompleted,
          }));
          setLeaderboardEntries(formattedLeaderboard);
        } catch (err) {
          console.error('Error fetching leaderboard:', err);
        }

        // Fetch real user stats if logged in
        if (user?.id) {
          try {
            const statsResponse = await fetch(`/api/users/stats?userId=${user.id}`);
            const statsData = await statsResponse.json();
            const stats = statsData.stats;
            if (stats) {
              console.log('📊 User stats loaded from API:', {
                userId: user.id,
                dailyEarnings: stats.dailyEarnings,
                weeklyEarnings: stats.weeklyEarnings,
                totalEarnings: stats.totalEarnings,
                tasksCompleted: stats.tasksCompleted,
                level: stats.level,
                currentStreak: stats.currentStreak,
              });
              setUserStats(stats);
            } else {
              console.warn('⚠️ No stats returned for user:', user.id);
            }
          } catch (err) {
            console.error('Error fetching user stats:', err);
          }
        } else {
          console.warn('⚠️ user.id not available');
        }

        // If user is an employer, load their tasks
        if (user?.id && userRole === 'employer') {
          try {
            const employerTasksResponse = await fetch(`/api/tasks/employer?employerId=${user.id}`);
            const employerTasksData = await employerTasksResponse.json();
            setEmployerTasks(employerTasksData.tasks || []);
          } catch (err) {
            console.error('Error fetching employer tasks:', err);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userData?.id, userRole, user?.id]);

  const handleRoleSwitch = async () => {
    if (!user?.id || isRoleSwitching) return;

    setIsRoleSwitching(true);
    const newRole = userRole === 'worker' ? 'employer' : 'worker';

    try {
      console.log(`🔄 Switching user role from ${userRole} to ${newRole}...`);

      // Call the switch-role API endpoint
      const response = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newRole: newRole,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to switch role:', result.error);
        throw new Error(result.error || 'Failed to switch role');
      }

      if (result.user) {
        console.log(`✅ User role updated to ${newRole}:`, result.user.userRole);
        setUserRole(newRole as UserRole);

        // Clear employer tasks if switching to worker
        if (newRole === 'worker') {
          setEmployerTasks([]);
        }
      } else {
        console.error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error switching role:', error);
    } finally {
      setIsRoleSwitching(false);
    }
  };

  const handleAcceptTask = (task: DatabaseTask | Task) => {
    setSelectedTask(task as DatabaseTask);
    setIsSubmissionModalOpen(true);
  };

  const handleSubmitTask = async (taskId: string, proof: string, submissionType: 'TEXT' | 'PHOTO' | 'AUDIO' | 'FILE') => {
    try {
      console.log('Task fields:', JSON.stringify({
        piReward: undefined, // Will check after we get currentTask
        pi_reward: undefined,
        reward: undefined,
        allKeys: undefined
      }));

      // Get the worker ID from Pi Auth context (use database user ID, not Pi user ID)
      if (!user?.id) {
        throw new Error('User not authenticated. Please login with Pi Network.');
      }

      const workerId = user.id;
      
      console.log(`📝 Submitting task proof for task: ${taskId}`);
      
      // Get the current task to capture agreed_reward at submission time
      const currentTask = tasks.find(t => t.id === taskId);
      if (!currentTask) {
        throw new Error('Task not found');
      }

      console.log('Task fields:', JSON.stringify({
        piReward: (currentTask as any).piReward,
        pi_reward: (currentTask as any).pi_reward,
        reward: (currentTask as any).reward,
        allKeys: Object.keys(currentTask)
      }));

      console.log('🔍 Task object:', JSON.stringify(currentTask));
      
      // STEP 2: Submit proof without payment (escrow model)
      // Worker submits proof → employer approves → system releases funds from escrow
      console.log('✅ [STEP 2] Proof submitted, awaiting employer review');
      
      // STEP 3: Create the submission record via API
      console.log(`✅ [STEP 3] Creating submission record...`);
      const submitResponse = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          workerId,
          proofContent: proof,
          submissionType,
          agreedReward: currentTask.piReward ?? currentTask.pi_reward ?? 0,
        }),
      });

      const submitData = await submitResponse.json();
      if (!submitResponse.ok) {
        throw new Error(submitData.error || 'Failed to save submission');
      }

      const submission = submitData.submission;
      if (!submission) {
        throw new Error('Failed to save submission');
      }

      console.log(`✅ [STEP 4] Task submission created with ID: ${submission.id}`);
      
      // STEP 5: Refresh tasks after submission
      console.log(`🔄 [STEP 5] Refreshing task list...`);
      const updatedTasksResponse = await fetch('/api/tasks/list');
      const updatedTasksData = await updatedTasksResponse.json();
      const updatedTasks = updatedTasksData.tasks || [];
      const availableTasks = userRole === 'worker' && user?.id 
        ? updatedTasks.filter((t: any) => t.employerId !== user.id)
        : updatedTasks;
      setTasks(availableTasks);
      console.log(`✅ [STEP 5] Task acceptance complete!`);
      
    } catch (error) {
      console.error('Error submitting task:', error);
      throw error;
    }
  };

  const filteredTasks = selectedCategory === 'all' 
    ? tasks 
    : tasks.filter(task => task.category === selectedCategory);

  const categories: { value: TaskCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Tasks' },
    { value: 'app-testing', label: 'App Testing' },
    { value: 'survey', label: 'Surveys' },
    { value: 'translation', label: 'Translation' },
    { value: 'audio-recording', label: 'Audio' },
    { value: 'photo-capture', label: 'Photos' },
    { value: 'content-review', label: 'Review' },
    { value: 'data-labeling', label: 'Data Labeling' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader 
        userRole={userRole} 
        onRoleSwitch={handleRoleSwitch}
        currentStreak={userStats.currentStreak}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 pb-20">
        {userRole === 'worker' ? (
          <>
            {/* Stats Overview */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Welcome back, Pioneer
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Level: {userStats.level}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatsCard
                  label="Today's Earnings"
                  value={`${userStats.dailyEarnings} π`}
                  icon={<Coins className="w-8 h-8" />}
                  trend="+2.5 π from yesterday"
                />
                <StatsCard
                  label="Tasks Completed"
                  value={userStats.tasksCompleted}
                  icon={<CheckCircle className="w-8 h-8" />}
                />
                <StatsCard
                  label="Available Tasks"
                  value={tasks.length}
                  icon={<Target className="w-8 h-8" />}
                />
                <StatsCard
                  label="Weekly Earnings"
                  value={`${userStats.weeklyEarnings} π`}
                  icon={<TrendingUp className="w-8 h-8" />}
                  trend="+18% from last week"
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground mb-3">Available Tasks</h2>
                  
                  {/* Category Filter */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category) => (
                      <Button
                        key={category.value}
                        variant={selectedCategory === category.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.value)}
                        className={`rounded-full whitespace-nowrap ${
                          selectedCategory === category.value
                            ? 'bg-primary hover:bg-primary/90'
                            : 'border-white/10 hover:border-primary/50'
                        }`}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onAccept={handleAcceptTask} />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <Leaderboard />
                
                {/* Quick Stats */}
                <div className="glassmorphism p-5 border-white/10 rounded-lg">
                  <h3 className="text-lg font-bold text-foreground mb-4">Your Progress</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Total Earnings</span>
                        <span className="font-bold text-primary">{userStats.totalEarnings} π</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: '68%' }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        132 π to Elite Pioneer
                      </p>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Current Streak</span>
                        <span className="text-2xl font-bold text-orange-400">
                          {userStats.currentStreak} 🔥
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Complete a task today to keep your streak!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Employer View */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Employer Dashboard
              </h1>
              <p className="text-muted-foreground">
                Review worker submissions and manage your tasks
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <StatsCard
                label="Active Tasks"
                value={employerTasks.length}
                icon={<Target className="w-8 h-8" />}
              />
              <StatsCard
                label="Total Reward"
                value={`${employerTasks.reduce((sum, t) => sum + (t.piReward ?? t.pi_reward ?? 0), 0)} π`}
                icon={<Coins className="w-8 h-8" />}
              />
              <StatsCard
                label="Slots Available"
                value={employerTasks.reduce((sum, t) => sum + (t.slotsRemaining ?? t.slots_remaining ?? 0), 0)}
                icon={<CheckCircle className="w-8 h-8" />}
              />
            </div>

            {user?.id && employerTasks.length > 0 ? (
              <EmployerDashboard employerId={user.id} employerTasks={employerTasks} />
            ) : (
              <div className="glassmorphism p-8 border-white/10 rounded-lg text-center">
                <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Post Your First Task
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get work done by verified Pioneers. Pay only for completed tasks with Pi coins.
                </p>
                {user?.id && userData.username && (
                  <CreateTaskModal
                    employerId={user.id}
                    employerUsername={userData.username}
                    onTaskCreated={() => {
                      // Reload employer tasks
                      const loadTasks = async () => {
                        const userEmployerTasks = await getTasksByEmployer(userData.id);
                        setEmployerTasks(userEmployerTasks);
                      };
                      loadTasks();
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Task Submission Modal */}
      <TaskSubmissionModal
        isOpen={isSubmissionModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsSubmissionModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleSubmitTask}
      />
    </div>
  );
}
