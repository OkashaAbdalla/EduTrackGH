/**
 * Simple Bar Chart Component
 * Pure CSS-based bar chart for attendance trends
 */

const SimpleBarChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.attendanceRate || 0));

  return (
    <div>
      {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{title}</h3>}
      <div className="space-y-3">
        {data.map((item, idx) => {
          const percentage = maxValue > 0 ? (item.attendanceRate / maxValue) * 100 : 0;
          const color = item.attendanceRate >= 80 ? 'bg-green-500' : 
                       item.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500';
          
          return (
            <div key={idx} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.month || item.schoolName}
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.attendanceRate}%
                </span>
              </div>
              <div className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${color} rounded-lg transition-all duration-500 ease-out group-hover:opacity-90`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="h-full flex items-center justify-end pr-2">
                    {item.totalRecords && (
                      <span className="text-xs font-medium text-white opacity-90">
                        {item.totalRecords} records
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimpleBarChart;
