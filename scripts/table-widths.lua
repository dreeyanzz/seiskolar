-- table-widths.lua
-- Proportional column width calculations for SEIskolar Software Design Document (.docx)
-- Prevents Pandoc from starving narrow columns when Markdown cells contain long text.

function Table(tbl)
  local num_cols = #tbl.colspecs
  local widths = {}

  local headers = {}
  if tbl.head and #tbl.head.rows > 0 and tbl.head.rows[1].cells then
    for i, c in ipairs(tbl.head.rows[1].cells) do
      table.insert(headers, pandoc.utils.stringify(c))
    end
  end

  local h1 = headers[1] or ""
  local h2 = headers[2] or ""
  local h3 = headers[3] or ""

  if num_cols == 2 then
    if h1 == "Attribute" or h1 == "Operation" then
      widths = {0.28, 0.72}
    elseif h1 == "Objective" then
      widths = {0.72, 0.28}
    elseif h1 == "System Function" then
      widths = {0.45, 0.55}
    else
      -- Field, Item, Constraint, etc.
      widths = {0.25, 0.75}
    end
  elseif num_cols == 3 then
    if h1 == "Layer" then
      widths = {0.18, 0.32, 0.50}
    elseif h1 == "System Function" then
      widths = {0.30, 0.40, 0.30}
    else
      widths = {0.25, 0.35, 0.40}
    end
  elseif num_cols == 4 then
    if h2 == "Yes" and h3 == "No" then
      -- Review Checklist (Question, Yes, No, Explanation)
      widths = {0.45, 0.08, 0.08, 0.39}
    elseif h1 == "Decision" and h2 == "Condition" then
      -- Decision points (Decision, Condition, If Yes, If No)
      widths = {0.24, 0.36, 0.20, 0.20}
    elseif h1 == "Object" and h2 == "Initial State" then
      -- Object state machine
      widths = {0.22, 0.16, 0.42, 0.20}
    elseif h1 == "Sender Component" then
      -- Component communication
      widths = {0.22, 0.30, 0.22, 0.26}
    elseif h1 == "Actor/External Entity" then
      widths = {0.22, 0.16, 0.26, 0.36}
    elseif h1 == "Requirement" and h2 == "System Function" then
      -- Part II function mapping
      widths = {0.15, 0.25, 0.30, 0.30}
    elseif h1 == "Component/Module" then
      widths = {0.22, 0.34, 0.26, 0.18}
    elseif h1 == "Proposed Class" then
      widths = {0.22, 0.38, 0.18, 0.22}
    elseif h1 == "NFR" and h2 == "Design Requirement" then
      -- Part XIV
      widths = {0.14, 0.34, 0.34, 0.18}
    elseif h1 == "External Interface" then
      widths = {0.22, 0.28, 0.28, 0.22}
    elseif h1 == "ID" then
      -- Part I NFRs, URs, SRs, ACs
      if h2 == "Non-Functional Requirement" then
        widths = {0.14, 0.36, 0.20, 0.30}
      elseif h2 == "User Requirement" then
        widths = {0.12, 0.36, 0.18, 0.34}
      elseif h2 == "System Requirement" then
        widths = {0.12, 0.38, 0.16, 0.34}
      elseif h2 == "Acceptance Criterion" then
        widths = {0.12, 0.46, 0.18, 0.24}
      else
        widths = {0.14, 0.36, 0.22, 0.28}
      end
    else
      widths = {0.20, 0.30, 0.25, 0.25}
    end
  elseif num_cols == 5 then
    -- Traceability Matrix (Req, Function, Component, Data/Class, Decision)
    widths = {0.14, 0.22, 0.18, 0.18, 0.28}
  elseif num_cols == 6 then
    -- Functional Requirements (ID, FR, Actor, Input, Processing, Output)
    widths = {0.13, 0.24, 0.14, 0.14, 0.21, 0.14}
  elseif num_cols == 7 then
    -- CRUD Matrix (Entity, Description, Used By, C, R, U, D)
    widths = {0.20, 0.34, 0.16, 0.07, 0.07, 0.08, 0.08}
  else
    local w = 1.0 / num_cols
    for i = 1, num_cols do
      widths[i] = w
    end
  end

  for i, col in ipairs(tbl.colspecs) do
    tbl.colspecs[i] = {col[1], widths[i]}
  end

  return tbl
end
