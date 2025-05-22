interface ActivityItem {
  id: string;
  description: string;
  date: string;
  opcEarned: number;
}

interface RecentActivityProps {
  activityItems: ActivityItem[];
}

const RecentActivity = ({ activityItems }: RecentActivityProps) => {
  return (
    <div className="card">
      <h2 className="card-title">Recent Activity</h2>
      {activityItems.length > 0 ? (
        activityItems.map((item) => (
          <div className="activity-item" key={item.id}>
            <div className="activity-content">
              <div>
                <p className="activity-desc">{item.description}</p>
                <p className="activity-date">{item.date}</p>
              </div>
              <span className="activity-opc">+{item.opcEarned} OPCs</span>
            </div>
          </div>
        ))
      ) : (
        <p className="empty-state">No recent activity yet. Start logging your smart spending!</p>
      )}
    </div>
  );
};

export default RecentActivity;
