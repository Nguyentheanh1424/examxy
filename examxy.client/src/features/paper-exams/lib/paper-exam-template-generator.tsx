/* eslint-disable react-refresh/only-export-components */
import { forwardRef } from "react";

import marker1Svg from "@/features/paper-exams/assets/markers/april_16h5-1.svg?raw";
import marker7Svg from "@/features/paper-exams/assets/markers/april_16h5-7.svg?raw";
import marker9Svg from "@/features/paper-exams/assets/markers/april_16h5-9.svg?raw";
import marker13Svg from "@/features/paper-exams/assets/markers/april_16h5-13.svg?raw";
import marker14Svg from "@/features/paper-exams/assets/markers/april_16h5-14.svg?raw";
import marker15Svg from "@/features/paper-exams/assets/markers/april_16h5-15.svg?raw";
import marker16Svg from "@/features/paper-exams/assets/markers/april_16h5-16.svg?raw";
import marker17Svg from "@/features/paper-exams/assets/markers/april_16h5-17.svg?raw";
import marker18Svg from "@/features/paper-exams/assets/markers/april_16h5-18.svg?raw";
import marker19Svg from "@/features/paper-exams/assets/markers/april_16h5-19.svg?raw";
import marker20Svg from "@/features/paper-exams/assets/markers/april_16h5-20.svg?raw";
import marker21Svg from "@/features/paper-exams/assets/markers/april_16h5-21.svg?raw";

export type Point = [number, number];
export type Rect = [number, number, number, number];

export interface CircleRoi {
  cx: number;
  cy: number;
  r: number;
  question: number;
  option: number;
}

export interface HandwrittenRegion {
  id: string;
  label: string;
  rect: Rect;
  padding_px: number;
  merge_mode: "replace_rect";
  save_patch: boolean;
}

export interface IdBubbleField {
  id: string;
  label: string;
  origin: Point;
  dx: number;
  dy: number;
  n_cols: number;
  n_rows: number;
  radius: number;
  row_values: string[];
}

export interface TemplateSettings {
  visibleHeaderLabels: {
    name: boolean;
    quiz: boolean;
    class: boolean;
    score: boolean;
  };
  showQuizIdField: boolean;
  showStudentIdField: boolean;
  numQuestions: number;
  optionsPerQuestion: number;
  headerLabels: {
    name: string;
    quiz: string;
    class: string;
    score: string;
  };
  idBubbles: {
    studentId: {
      label: string;
      n_cols: number;
      n_rows: number;
    };
    quizId: {
      label: string;
      n_cols: number;
      n_rows: number;
    };
  };
}

export interface GeneratedTemplateConfig {
  master: {
    width: number;
    height: number;
  };
  template_marker_layout: Record<string, Point>;
  handwritten_regions: HandwrittenRegion[];
  id_bubble_fields: IdBubbleField[];
  region_windows: number[][];
  circle_rois: CircleRoi[];
  omr_thresholds: {
    abs_th: number;
    rel_th: number;
    meta: {
      method: "annulus_patch_darkness";
      r_in_ratio: number;
      r_out_ratio: number;
    };
  };
}

export const templateMaster = {
  height: 2339,
  width: 1654,
} as const;

export const defaultTemplateSettings: TemplateSettings = {
  headerLabels: {
    class: "Class",
    name: "Name",
    quiz: "Quiz",
    score: "Score",
  },
  idBubbles: {
    quizId: {
      label: "QuizId",
      n_cols: 5,
      n_rows: 6,
    },
    studentId: {
      label: "StudentId",
      n_cols: 6,
      n_rows: 6,
    },
  },
  numQuestions: 40,
  optionsPerQuestion: 5,
  showQuizIdField: true,
  showStudentIdField: true,
  visibleHeaderLabels: {
    class: true,
    name: true,
    quiz: true,
    score: true,
  },
};

export const fixedMarkerLayout: Record<string, Point> = {
  "1": [132, 70],
  "7": [833, 81],
  "9": [1510, 70],
  "13": [131, 671],
  "15": [832, 671],
  "17": [1510, 672],
  "14": [130, 1433],
  "16": [832, 1429],
  "21": [1510, 1433],
  "19": [130, 2212],
  "20": [834, 2213],
  "18": [1512, 2213],
};

const markerSize = 80;
const markerSvgSources: Record<string, string> = {
  "1": marker1Svg,
  "7": marker7Svg,
  "9": marker9Svg,
  "13": marker13Svg,
  "14": marker14Svg,
  "15": marker15Svg,
  "16": marker16Svg,
  "17": marker17Svg,
  "18": marker18Svg,
  "19": marker19Svg,
  "20": marker20Svg,
  "21": marker21Svg,
};
const markerSvgAssets = Object.fromEntries(
  Object.entries(markerSvgSources).map(([id, svg]) => [id, parseMarkerSvg(svg)]),
) as Record<string, MarkerSvgAsset>;
const questionsPerBlock = 10;
const answerBlockOrigins: Point[] = [
  [360, 790],
  [1020, 790],
  [360, 1530],
  [1020, 1530],
];
const answerBubble = {
  dx: 60,
  dy: 63,
  radius: 18,
} as const;
const optionLetters = ["A", "B", "C", "D", "E", "F"];
const idBubbleRowValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const handwrittenRegionBase: Array<Omit<HandwrittenRegion, "label">> = [
  {
    id: "name_line",
    merge_mode: "replace_rect",
    padding_px: 10,
    rect: [198, 143, 753, 223],
    save_patch: true,
  },
  {
    id: "quiz_line",
    merge_mode: "replace_rect",
    padding_px: 10,
    rect: [195, 244, 750, 324],
    save_patch: true,
  },
  {
    id: "class_line",
    merge_mode: "replace_rect",
    padding_px: 10,
    rect: [193, 346, 748, 426],
    save_patch: true,
  },
  {
    id: "score_line",
    merge_mode: "replace_rect",
    padding_px: 10,
    rect: [192, 447, 747, 527],
    save_patch: true,
  },
];
const idBubbleGeometry = {
  quizId: {
    dx: 38,
    dy: 59,
    id: "field_2",
    origin: [1248, 241] as Point,
    radius: 15,
  },
  studentId: {
    dx: 38,
    dy: 59,
    id: "field_1",
    origin: [974, 242] as Point,
    radius: 14,
  },
} as const;

export function clampTemplateSettings(
  settings: TemplateSettings,
): TemplateSettings {
  return {
    ...settings,
    idBubbles: {
      quizId: {
        ...settings.idBubbles.quizId,
        n_cols: clampInteger(settings.idBubbles.quizId.n_cols, 1, 10),
        n_rows: clampInteger(settings.idBubbles.quizId.n_rows, 1, 10),
      },
      studentId: {
        ...settings.idBubbles.studentId,
        n_cols: clampInteger(settings.idBubbles.studentId.n_cols, 1, 10),
        n_rows: clampInteger(settings.idBubbles.studentId.n_rows, 1, 10),
      },
    },
    numQuestions: clampInteger(settings.numQuestions, 1, 40),
    optionsPerQuestion: clampInteger(settings.optionsPerQuestion, 2, 6),
    showQuizIdField: settings.showQuizIdField ?? true,
    showStudentIdField: settings.showStudentIdField ?? true,
    visibleHeaderLabels: {
      class: settings.visibleHeaderLabels?.class ?? true,
      name: settings.visibleHeaderLabels?.name ?? true,
      quiz: settings.visibleHeaderLabels?.quiz ?? true,
      score: settings.visibleHeaderLabels?.score ?? true,
    },
  };
}

export function generateCircleRois(settings: TemplateSettings): CircleRoi[] {
  const safeSettings = clampTemplateSettings(settings);
  const rois: CircleRoi[] = [];

  for (
    let questionIndex = 0;
    questionIndex < safeSettings.numQuestions;
    questionIndex += 1
  ) {
    const blockIndex = Math.floor(questionIndex / questionsPerBlock);
    const row = questionIndex % questionsPerBlock;
    const [originX, originY] = answerBlockOrigins[blockIndex];

    for (
      let option = 0;
      option < safeSettings.optionsPerQuestion;
      option += 1
    ) {
      rois.push({
        cx: originX + option * answerBubble.dx,
        cy: originY + row * answerBubble.dy,
        option,
        question: questionIndex + 1,
        r: answerBubble.radius,
      });
    }
  }

  return rois;
}

export function generateHandwrittenRegions(
  settings: TemplateSettings,
): HandwrittenRegion[] {
  const safeSettings = clampTemplateSettings(settings);
  const labelConfigs = [
    {
      isVisible: safeSettings.visibleHeaderLabels.name,
      label: safeSettings.headerLabels.name,
    },
    {
      isVisible: safeSettings.visibleHeaderLabels.quiz,
      label: safeSettings.headerLabels.quiz,
    },
    {
      isVisible: safeSettings.visibleHeaderLabels.class,
      label: safeSettings.headerLabels.class,
    },
    {
      isVisible: safeSettings.visibleHeaderLabels.score,
      label: safeSettings.headerLabels.score,
    },
  ];

  return handwrittenRegionBase.flatMap((region, index) => {
    const config = labelConfigs[index];

    return config?.isVisible
      ? [
          {
            ...region,
            label: config.label,
          },
        ]
      : [];
  });
}

export function generateIdBubbleFields(
  settings: TemplateSettings,
): IdBubbleField[] {
  const safeSettings = clampTemplateSettings(settings);
  const student = safeSettings.idBubbles.studentId;
  const quiz = safeSettings.idBubbles.quizId;
  const studentGeometry = idBubbleGeometry.studentId;
  const quizGeometry = idBubbleGeometry.quizId;

  const fields: IdBubbleField[] = [];

  if (safeSettings.showStudentIdField) {
    fields.push({
      ...studentGeometry,
      label: student.label,
      n_cols: student.n_cols,
      n_rows: student.n_rows,
      row_values: idBubbleRowValues.slice(0, student.n_rows),
    });
  }

  if (safeSettings.showQuizIdField) {
    fields.push({
      ...quizGeometry,
      label: quiz.label,
      n_cols: quiz.n_cols,
      n_rows: quiz.n_rows,
      row_values: idBubbleRowValues.slice(0, quiz.n_rows),
    });
  }

  return fields;
}

export function generateTemplateConfig(
  settings: TemplateSettings,
): GeneratedTemplateConfig {
  const safeSettings = clampTemplateSettings(settings);

  return {
    circle_rois: generateCircleRois(safeSettings),
    handwritten_regions: generateHandwrittenRegions(safeSettings),
    id_bubble_fields: generateIdBubbleFields(safeSettings),
    master: templateMaster,
    omr_thresholds: {
      abs_th: 0.2,
      meta: {
        method: "annulus_patch_darkness",
        r_in_ratio: 0.45,
        r_out_ratio: 0.85,
      },
      rel_th: 0.0555,
    },
    region_windows: [],
    template_marker_layout: fixedMarkerLayout,
  };
}

export function generatedJsonAssets(settings: TemplateSettings) {
  const config = generateTemplateConfig(settings);

  return {
    CircleRois: JSON.stringify(config.circle_rois, null, 2),
    IdBubbleFields: JSON.stringify(config.id_bubble_fields, null, 2),
    MarkerLayout: JSON.stringify(config.template_marker_layout, null, 2),
    RegionWindows: JSON.stringify(config.region_windows, null, 2),
  };
}

export function templateSettingsFromVersionValues(values: {
  questionCount: string | number;
  optionsPerQuestion: string | number;
}): TemplateSettings {
  return {
    ...defaultTemplateSettings,
    numQuestions:
      Number(values.questionCount) || defaultTemplateSettings.numQuestions,
    optionsPerQuestion:
      Number(values.optionsPerQuestion) ||
      defaultTemplateSettings.optionsPerQuestion,
  };
}

export async function exportTemplateSvgToPdf(
  svg: SVGSVGElement,
  filename = "paper-exam-template.pdf",
) {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([
    import("jspdf"),
    import("svg2pdf.js"),
  ]);
  const pdf = new jsPDF({ format: "a4", orientation: "portrait", unit: "pt" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const scale = Math.min(
    pageWidth / templateMaster.width,
    pageHeight / templateMaster.height,
  );
  const drawWidth = templateMaster.width * scale;
  const drawHeight = templateMaster.height * scale;

  await svg2pdf(svg, pdf, {
    height: drawHeight,
    width: drawWidth,
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
  });
  pdf.save(filename);
}

export const TemplateSvgPreview = forwardRef<
  SVGSVGElement,
  {
    className?: string;
    settings: TemplateSettings;
    showOutlines?: boolean;
  }
>(function TemplateSvgPreview(
  { className, settings, showOutlines = true },
  ref,
) {
  const safeSettings = clampTemplateSettings(settings);
  const handwritten = generateHandwrittenRegions(safeSettings);
  const idBubbles = generateIdBubbleFields(safeSettings);
  const rois = generateCircleRois(safeSettings);
  const visibleBlocks = Math.ceil(
    safeSettings.numQuestions / questionsPerBlock,
  );

  return (
    <svg
      className={className}
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${templateMaster.width} ${templateMaster.height}`}
      ref={ref}
    >
      <rect
        fill="white"
        height={templateMaster.height}
        stroke="#cbd5e1"
        strokeWidth={2}
        width={templateMaster.width}
        x={0}
        y={0}
      />

      {Object.entries(fixedMarkerLayout).map(([id, [x, y]]) => (
        <FiducialMarker cx={x} cy={y} id={id} key={id} />
      ))}

      {handwritten.map((region) => {
        const [x1, y1, x2, y2] = region.rect;
        const labelY = (y1 + y2) / 2;

        return (
          <g key={region.id}>
            <text
              fill="#0f172a"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize={28}
              textAnchor="end"
              x={x1 - 12}
              y={labelY + 10}
            >
              {region.label}:
            </text>
            <line
              stroke="#0f172a"
              strokeWidth={1.8}
              x1={x1}
              x2={x2}
              y1={y2 - 4}
              y2={y2 - 4}
            />
            {showOutlines ? (
              <rect
                fill="none"
                height={y2 - y1}
                opacity={0.35}
                stroke="#2563eb"
                strokeDasharray="6 4"
                strokeWidth={1}
                width={x2 - x1}
                x={x1}
                y={y1}
              />
            ) : null}
          </g>
        );
      })}

      {idBubbles.map((field) => {
        const [originX, originY] = field.origin;
        const boxHeight = 28;

        return (
          <g key={field.id}>
            <text
              fill="#0f172a"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              fontSize={26}
              fontWeight={500}
              x={originX - field.radius - 4}
              y={originY - 70}
            >
              {field.label}:
            </text>

            {Array.from({ length: field.n_cols }).map((_, column) => (
              <rect
                fill="none"
                height={boxHeight}
                key={`box-${column}`}
                stroke="#0f172a"
                strokeWidth={1.5}
                width={field.radius * 2}
                x={originX + column * field.dx - field.radius}
                y={originY - 50}
              />
            ))}

            {Array.from({ length: field.n_rows }).map((_, row) =>
              Array.from({ length: field.n_cols }).map((__, column) => (
                <circle
                  cx={originX + column * field.dx}
                  cy={originY + row * field.dy}
                  fill="none"
                  key={`bubble-${row}-${column}`}
                  r={field.radius}
                  stroke="#0f172a"
                  strokeWidth={1.5}
                />
              )),
            )}

            {showOutlines
              ? Array.from({ length: field.n_rows }).map((_, row) =>
                  Array.from({ length: field.n_cols }).map((__, column) => (
                    <text
                      fill="#94a3b8"
                      fontFamily="ui-sans-serif, system-ui, sans-serif"
                      fontSize={11}
                      key={`value-${row}-${column}`}
                      textAnchor="middle"
                      x={originX + column * field.dx}
                      y={originY + row * field.dy + 4}
                    >
                      {idBubbleRowValues[row] ?? ""}
                    </text>
                  )),
                )
              : null}
          </g>
        );
      })}

      {answerBlockOrigins
        .slice(0, visibleBlocks)
        .map(([blockX, blockY], blockIndex) => (
          <g key={`header-${blockIndex}`}>
            {Array.from({ length: safeSettings.optionsPerQuestion }).map(
              (_, option) => (
                <text
                  fill="#0f172a"
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontSize={22}
                  fontWeight={700}
                  key={option}
                  textAnchor="middle"
                  x={blockX + option * answerBubble.dx}
                  y={blockY - 24}
                >
                  {optionLetters[option] ?? ""}
                </text>
              ),
            )}
          </g>
        ))}

      {rois.map((roi) => (
        <circle
          cx={roi.cx}
          cy={roi.cy}
          fill="none"
          key={`question-${roi.question}-option-${roi.option}`}
          r={roi.r}
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      ))}

      {rois
        .filter((roi) => roi.option === 0)
        .map((roi) => (
          <text
            fill="#0f172a"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontSize={22}
            fontWeight={700}
            key={`question-${roi.question}`}
            textAnchor="end"
            x={roi.cx - 38}
            y={roi.cy + 7}
          >
            {roi.question}
          </text>
        ))}
    </svg>
  );
});

function FiducialMarker({
  cx,
  cy,
  id,
}: {
  cx: number;
  cy: number;
  id: string;
}) {
  const marker = markerSvgAssets[id];
  const x0 = cx - markerSize / 2;
  const y0 = cy - markerSize / 2;

  return (
    <g
      aria-label={`marker-${id}`}
      transform={`translate(${x0} ${y0}) scale(${markerSize / marker.viewBox.width} ${markerSize / marker.viewBox.height}) translate(${-marker.viewBox.x} ${-marker.viewBox.y})`}
    >
      {marker.rects.map((rect, index) => (
        <rect
          fill={rect.fill}
          height={rect.height}
          key={`${id}-${index}`}
          width={rect.width}
          x={rect.x}
          y={rect.y}
        />
      ))}
    </g>
  );
}

function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

interface MarkerSvgRect {
  fill: string;
  height: number;
  width: number;
  x: number;
  y: number;
}

interface MarkerSvgAsset {
  rects: MarkerSvgRect[];
  viewBox: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
}

function parseMarkerSvg(svg: string): MarkerSvgAsset {
  const viewBox = parseMarkerViewBox(svg);
  const rects: MarkerSvgRect[] = [];
  const rectPattern = /<rect\b([^>]*)>/gi;
  let rectMatch = rectPattern.exec(svg);

  while (rectMatch) {
    const attributes = parseSvgAttributes(rectMatch[1] ?? "");

    rects.push({
      fill: attributes.fill ?? "black",
      height: parseSvgNumber(attributes.height, viewBox.height),
      width: parseSvgNumber(attributes.width, viewBox.width),
      x: parseSvgNumber(attributes.x, 0),
      y: parseSvgNumber(attributes.y, 0),
    });

    rectMatch = rectPattern.exec(svg);
  }

  return {
    rects,
    viewBox,
  };
}

function parseMarkerViewBox(svg: string): MarkerSvgAsset["viewBox"] {
  const match = /\bviewBox="([^"]+)"/i.exec(svg);
  const values = match?.[1]
    ?.trim()
    .split(/\s+/)
    .map((value) => Number(value));

  if (values?.length === 4 && values.every(Number.isFinite)) {
    return {
      height: values[3] ?? 6,
      width: values[2] ?? 6,
      x: values[0] ?? 0,
      y: values[1] ?? 0,
    };
  }

  return {
    height: 6,
    width: 6,
    x: 0,
    y: 0,
  };
}

function parseSvgAttributes(value: string) {
  const attributes: Record<string, string> = {};
  const attributePattern = /([a-zA-Z_:][\w:.-]*)="([^"]*)"/g;
  let attributeMatch = attributePattern.exec(value);

  while (attributeMatch) {
    attributes[attributeMatch[1] ?? ""] = attributeMatch[2] ?? "";
    attributeMatch = attributePattern.exec(value);
  }

  return attributes;
}

function parseSvgNumber(value: string | undefined, fallback: number) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}
