git checkout -b add-prd
mkdir docs
cat << 'EOF' > docs/PRD.md
# Prizefight MVP Product Requirements Document

## 1. Executive Summary
Prizefight is a gamified savings…

<!-- paste full PRD content here -->
EOF

git add docs/PRD.md
git commit -m "chore(docs): add MVP PRD"
git push origin add-prd
